import { readFileSync } from "node:fs";

import { sources } from "@app/shared/db/schema";
import { AnswerPart, Citation, RichText } from "@app/shared/schemas";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { chatModel } from "../src/ai-models";
import { db } from "../src/db";
import { answerQuestion } from "../src/mentor/mentor.service";

// Asks the Mentor every question in answer-key.json, exactly as the app does,
// and grades each answer against the reference: is it right, and does it point
// to a page that holds the answer? Runs on the most recently added Ready book.
//
//   npm run eval -w @app/backend

type AnswerKeyEntry = {
  question: string;
  answer: string;
  pages: number[];
  answerable: boolean;
  indirect?: boolean;
};

const PARALLEL_QUESTIONS = 5;

const NOT_COVERED_TEXT = "I couldn't find anything about this in your Sources.";

const GRADER_SYSTEM_PROMPT = `
You grade a reading mentor's answer to a question about a book, against a reference answer written from the book.

Grades:
- correct: has the reference's key facts. Extra details are fine if they don't contradict it.
- partial: right, but misses a key fact, name, or condition from the reference.
- wrong: misses the key facts, contradicts the reference, or says the book doesn't cover something the reference says it does.

When the reference says the book doesn't answer the question: correct if the answer says it couldn't find it, even if it adds related content; wrong if it answers as if the book covered it.
`;

const graderChain = ChatPromptTemplate.fromMessages<{
  question: string;
  reference: string;
  answer: string;
}>([
  ["system", GRADER_SYSTEM_PROMPT],
  [
    "human",
    "Question: {question}\n\nReference answer: {reference}\n\nMentor's answer: {answer}",
  ],
]).pipe(
  chatModel.withStructuredOutput(
    z.object({
      grade: z.enum(["correct", "partial", "wrong"]),
      reason: z.string().describe("One short sentence"),
    }),
  ),
);

// Page references written in the answer, like (p. 54) or (pp. 103–105).
const PAGE_REFERENCE = /pp?\.\s*(\d+)(?:\s*[–-]\s*(\d+))?/g;

const toPlainText = (content: RichText) =>
  content
    .map((piece) => (piece.type === "text" ? piece.text : `[${piece.number}]`))
    .join("");

const partToPlainText = (part: AnswerPart) => {
  if (part.type === "not-covered") {
    return NOT_COVERED_TEXT;
  }

  return part.type === "section" || part.type === "text"
    ? toPlainText(part.content)
    : "";
};

// The pages an answer points to: its Citations, and the pages it names.
const referencedPages = (answer: string, citations: Citation[]) => {
  const citedPages = citations.flatMap((citation) =>
    citation.location.kind === "page" ? [citation.location.page] : [],
  );
  const namedPages = [...answer.matchAll(PAGE_REFERENCE)].flatMap((match) => {
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);

    return Array.from(
      { length: last - first + 1 },
      (_, index) => first + index,
    );
  });

  return [...citedPages, ...namedPages];
};

const answerKeyPath = new URL("./answer-key.json", import.meta.url);
const answerKey: AnswerKeyEntry[] = JSON.parse(
  readFileSync(answerKeyPath, "utf8"),
);

const findLatestBook = async () => {
  const [book] = await db
    .select()
    .from(sources)
    .where(eq(sources.state, "ready"))
    .orderBy(desc(sources.createdAt))
    .limit(1);

  return book;
};

const evaluate = async (
  entry: AnswerKeyEntry,
  book: typeof sources.$inferSelect,
) => {
  const reply = await answerQuestion(entry.question, [book]);
  const answer = reply.parts.map(partToPlainText).join("\n");
  const { grade, reason } = await graderChain.invoke({
    question: entry.question,
    reference: entry.answer,
    answer,
  });

  const pages = referencedPages(answer, reply.citations);
  // A chunk is cited by the page it starts on, so one page early still counts.
  const pointsToAnswerPage = pages.some(
    (page) => entry.pages.includes(page) || entry.pages.includes(page + 1),
  );

  return { entry, grade, reason, pointsToAnswerPage };
};

type Result = Awaited<ReturnType<typeof evaluate>>;

const evaluateAll = async (book: typeof sources.$inferSelect) => {
  const results: Result[] = [];

  for (let start = 0; start < answerKey.length; start += PARALLEL_QUESTIONS) {
    const group = answerKey.slice(start, start + PARALLEL_QUESTIONS);
    const groupResults = await Promise.all(
      group.map((entry) => evaluate(entry, book)),
    );

    results.push(...groupResults);
  }

  return results;
};

const countGrade = (results: Result[], grade: Result["grade"]) =>
  results.filter((result) => result.grade === grade).length;

const main = async () => {
  const book = await findLatestBook();

  if (!book) {
    throw new Error("No Ready book found to evaluate.");
  }

  const results = await evaluateAll(book);
  const answerable = results.filter((result) => result.entry.answerable);
  const traps = results.filter((result) => !result.entry.answerable);
  const withAnswerPage = answerable.filter(
    (result) => result.pointsToAnswerPage,
  );

  console.log(`"${book.title}" by ${book.author}\n`);
  console.log(
    `Answerable (${answerable.length}): ${countGrade(answerable, "correct")} correct, ${countGrade(answerable, "partial")} partial, ${countGrade(answerable, "wrong")} wrong`,
  );
  console.log(
    `  pointing to an answer page: ${withAnswerPage.length} of ${answerable.length}`,
  );
  console.log(
    `Not covered by the book (${traps.length}): ${countGrade(traps, "correct")} handled correctly\n`,
  );

  console.log("Not correct:");
  results
    .filter((result) => result.grade !== "correct")
    .forEach((result) =>
      console.log(
        `  ${result.grade}: ${result.entry.question}\n    ${result.reason}`,
      ),
    );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
