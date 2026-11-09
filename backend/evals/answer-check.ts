import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AnswerPart, RichText } from "@app/shared/schemas";
import { z } from "zod";

import { chatModel } from "../src/ai-models";
import { answerFromSearchQueries } from "../src/mentor/mentor.service";
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

// Checks the Mentor's full answers against answer-key.json: each answer is
// written exactly as in the app, then graded against the reference answer.
//
//   npx tsx --env-file=.env evals/answer-check.ts [runs] [sourceId]
//
// Defaults: 1 run, on the most recently added Ready book.

const PARALLEL_QUESTIONS = 5;

// The text the app shows when nothing in the book is related.
const NOT_COVERED_TEXT = "I couldn't find anything about this in your Sources.";

const GRADER_SYSTEM_PROMPT = `
You grade a reading mentor's answer to a question about a book, against a reference answer written from the book.

Grades:
- correct: has the reference's key facts. Extra details are fine if they don't contradict it.
- partial: right, but misses a key fact, name, or condition from the reference.
- wrong: misses the key facts, contradicts the reference, or says the book doesn't cover something the reference says it does.

When the reference says the book doesn't answer the question: correct if the answer says it couldn't find it, even if it adds related content; wrong if it answers as if the book covered it.

contradicts: true if the answer states something that contradicts the reference, or presents an answer the book doesn't give.
`;

const graderPrompt = ChatPromptTemplate.fromMessages<{
  question: string;
  reference: string;
  answer: string;
}>([
  ["system", GRADER_SYSTEM_PROMPT],
  [
    "human",
    "Question: {question}\n\nReference answer: {reference}\n\nMentor's answer: {answer}",
  ],
]);

const gradeSchema = z.object({
  grade: z.enum(["correct", "partial", "wrong"]),
  contradicts: z.boolean(),
  reason: z.string().describe("One short sentence"),
});

const graderChain = graderPrompt.pipe(
  chatModel.withStructuredOutput(gradeSchema),
);

type Grade = z.infer<typeof gradeSchema> & {
  question: string;
  answerable: boolean;
};

const richTextToPlain = (content: RichText) =>
  content
    .map((piece) => (piece.type === "text" ? piece.text : `[${piece.number}]`))
    .join("");

const partToPlain = (part: AnswerPart) => {
  if (part.type === "not-covered") {
    return NOT_COVERED_TEXT;
  }

  if (part.type === "section" || part.type === "text") {
    return richTextToPlain(part.content);
  }

  return "";
};

const checkQuestion = async (
  entry: AnswerKeyEntry,
  book: Book,
): Promise<Record<Option, Grade>> => {
  const rewrittenQueries = await writeRewrittenQueries(entry.question, book);

  const checkOption = async (option: Option): Promise<Grade> => {
    const searchQueries = searchQueriesFor(
      option,
      entry.question,
      rewrittenQueries,
    );
    const reply = await answerFromSearchQueries(
      entry.question,
      [book],
      searchQueries,
    );
    const answer = reply.parts.map(partToPlain).join("\n");

    const grade = await graderChain.invoke({
      question: entry.question,
      reference: entry.answer,
      answer,
    });

    return { ...grade, question: entry.question, answerable: entry.answerable };
  };

  const [a, b, c] = await Promise.all(OPTION_KEYS.map(checkOption));

  return { A: a, B: b, C: c };
};

const countGrades = (grades: Grade[]) => {
  const count = (grade: Grade["grade"]) =>
    grades.filter((entry) => entry.grade === grade).length;
  const contradictions = grades.filter((entry) => entry.contradicts).length;

  return {
    correct: count("correct"),
    partial: count("partial"),
    wrong: count("wrong"),
    contradictions,
  };
};

const toRow = (label: string, grades: Grade[]) => {
  const counts = countGrades(grades);
  const total = `/ ${grades.length}`;

  return `${label.padEnd(38)}${`${counts.correct} ${total}`.padEnd(10)}${String(counts.partial).padEnd(9)}${String(counts.wrong).padEnd(7)}${counts.contradictions}`;
};

const main = async () => {
  const [runsArgument, sourceId] = process.argv.slice(2);
  const runs = Number(runsArgument ?? 1);
  const book = await findBook(sourceId);

  if (!book) {
    throw new Error("No Ready book found to check.");
  }

  console.log(`Book: "${book.title}" by ${book.author}`);
  console.log(`${answerKey.length} questions, ${runs} run(s)\n`);

  for (let run = 1; run <= runs; run++) {
    const results = await inGroups(answerKey, PARALLEL_QUESTIONS, (entry) =>
      checkQuestion(entry, book),
    );

    console.log(`Run ${run}`);
    console.log(
      `${"Option".padEnd(38)}${"Correct".padEnd(10)}${"Partial".padEnd(9)}${"Wrong".padEnd(7)}Contradicts`,
    );

    for (const option of OPTION_KEYS) {
      const grades = results.map((result) => result[option]);
      const answerable = grades.filter((grade) => grade.answerable);
      const traps = grades.filter((grade) => !grade.answerable);

      console.log(toRow(`${option}  ${OPTIONS[option]}`, grades));
      console.log(toRow("     answerable questions", answerable));
      console.log(toRow("     trap questions", traps));
    }

    console.log("\nNot correct (option: grade, reason):");
    for (const result of results) {
      const misses = OPTION_KEYS.filter(
        (option) => result[option].grade !== "correct",
      );

      if (misses.length === 0) {
        continue;
      }

      console.log(`  ${result.A.question}`);
      for (const option of misses) {
        console.log(
          `    ${option}: ${result[option].grade}, ${result[option].reason}`,
        );
      }
    }
    console.log("");
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
