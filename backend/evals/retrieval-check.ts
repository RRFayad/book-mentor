import { retrieveFromSourceId } from "../src/mentor/retrieval.service";
import {
  AnswerKeyEntry,
  answerKey,
  Book,
  findBook,
  inGroups,
  Option,
  OPTION_KEYS,
  OPTIONS,
  searchQueriesFor,
  writeRewrittenQueries,
} from "./eval-setup";

// Checks retrieval alone, against answer-key.json: for each question, did the
// search bring back a page that holds the answer? No answer is written.
//
//   npx tsx --env-file=.env evals/retrieval-check.ts [runs] [sourceId]
//
// Defaults: 2 runs, on the most recently added Ready book.

const PARALLEL_QUESTIONS = 6;

type QuestionResult = {
  question: string;
  indirect: boolean;
  firstPassageHit: number | null;
  noteHit: boolean;
};

const answerableQuestions = answerKey.filter((entry) => entry.answerable);

// A chunk is stored under the page it starts on, so one starting a page
// early can still hold the expected page's text.
const passageHoldsPage = (passagePage: number | null, pages: number[]) =>
  passagePage !== null &&
  (pages.includes(passagePage) || pages.includes(passagePage + 1));

const noteCoversPage = (
  note: { firstPage: number; lastPage: number },
  pages: number[],
) => pages.some((page) => note.firstPage <= page && page <= note.lastPage);

const checkQuestion = async (
  entry: AnswerKeyEntry,
  book: Book,
): Promise<Record<Option, QuestionResult>> => {
  const rewrittenQueries = await writeRewrittenQueries(entry.question, book);

  const checkOption = async (option: Option): Promise<QuestionResult> => {
    const searchQueries = searchQueriesFor(
      option,
      entry.question,
      rewrittenQueries,
    );
    const retrieved = await retrieveFromSourceId(searchQueries, book.id);

    const hitIndex = retrieved.passages.findIndex((passage) =>
      passageHoldsPage(passage.page, entry.pages),
    );
    const noteHit = retrieved.notes.some((note) =>
      noteCoversPage(note, entry.pages),
    );

    return {
      question: entry.question,
      indirect: entry.indirect ?? false,
      firstPassageHit: hitIndex === -1 ? null : hitIndex + 1,
      noteHit,
    };
  };

  const [a, b, c] = await Promise.all([
    checkOption("A"),
    checkOption("B"),
    checkOption("C"),
  ]);

  return { A: a, B: b, C: c };
};

const checkAllQuestions = (book: Book) =>
  inGroups(answerableQuestions, PARALLEL_QUESTIONS, (entry) =>
    checkQuestion(entry, book),
  );

// What counts: the answer's pages reached the Mentor, from a passage or a Note.
const isFound = (result: QuestionResult) =>
  result.firstPassageHit !== null || result.noteHit;

const summarize = (results: QuestionResult[]) => {
  const found = results.filter(isFound);
  const passageHits = results.filter((result) => result.firstPassageHit);
  const noteHits = results.filter((result) => result.noteHit);
  const hitRanks = passageHits.map((result) => result.firstPassageHit ?? 0);
  const averageRank =
    hitRanks.reduce((total, rank) => total + rank, 0) / hitRanks.length;

  return {
    found: `${found.length} / ${results.length}`,
    passages: `${passageHits.length} / ${results.length}`,
    notes: `${noteHits.length} / ${results.length}`,
    averageRank: hitRanks.length > 0 ? averageRank.toFixed(1) : "-",
  };
};

const toRow = (label: string, summary: ReturnType<typeof summarize>) =>
  `${label.padEnd(38)}${summary.found.padEnd(9)}${summary.passages.padEnd(13)}${summary.notes.padEnd(10)}${summary.averageRank}`;

// A passage rank (1 = top), N when only a Note found it, - when nothing did.
const describeResult = (result: QuestionResult) => {
  if (result.firstPassageHit !== null) {
    return String(result.firstPassageHit);
  }

  return result.noteHit ? "N" : "-";
};

const main = async () => {
  const [runsArgument, sourceId] = process.argv.slice(2);
  const runs = Number(runsArgument ?? 2);
  const book = await findBook(sourceId);
  const options = OPTION_KEYS;

  if (!book) {
    throw new Error("No Ready book found to check.");
  }

  console.log(`Book: "${book.title}" by ${book.author}`);
  console.log(
    `${answerableQuestions.length} answerable questions, ${runs} run(s)\n`,
  );

  for (let run = 1; run <= runs; run++) {
    const results = await checkAllQuestions(book);

    console.log(`Run ${run}`);
    console.log(
      `${"Option".padEnd(38)}${"Found".padEnd(9)}${"Passage hit".padEnd(13)}${"Note hit".padEnd(10)}Avg. rank of first passage hit`,
    );

    for (const option of options) {
      const optionResults = results.map((result) => result[option]);
      const indirectResults = optionResults.filter((result) => result.indirect);

      console.log(
        toRow(`${option}  ${OPTIONS[option]}`, summarize(optionResults)),
      );
      console.log(
        toRow("     indirect questions only", summarize(indirectResults)),
      );
    }

    console.log("\nNot found by any option (neither a passage nor a Note):");
    const missedByAll = results.filter((result) =>
      options.every((option) => !isFound(result[option])),
    );
    missedByAll.forEach((result) => console.log(`  - ${result.A.question}`));

    console.log(
      "\nWhere the options disagree (passage rank, N = Note only, - = not found):",
    );
    const disagreements = results.filter((result) => {
      const found = options.map((option) => isFound(result[option]));

      return new Set(found).size > 1;
    });
    disagreements.forEach((result) => {
      const outcomes = options
        .map((option) => `${option}:${describeResult(result[option])}`)
        .join(" ");

      console.log(`  ${outcomes}  ${result.A.question}`);
    });
    console.log("");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
