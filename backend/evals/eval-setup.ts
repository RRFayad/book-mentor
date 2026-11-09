import { readFileSync } from "node:fs";

import { sources } from "@app/shared/db/schema";
import { and, desc, eq } from "drizzle-orm";

import { db } from "../src/db";
import { searchQueriesChain } from "../src/mentor/mentor.chains";
import { MAX_SEARCH_QUERIES } from "../src/mentor/retrieval.service";

// What the retrieval and answer checks share: the answer key, the book they
// run on, and the search query options they compare.

export type AnswerKeyEntry = {
  question: string;
  answer: string;
  pages: number[];
  answerable: boolean;
  // Asked without the name or term the answer is about, the way a reader who
  // doesn't know it yet would ask.
  indirect?: boolean;
};

export type Book = typeof sources.$inferSelect;

export type Option = "A" | "B" | "C";

export const OPTIONS: Record<Option, string> = {
  A: "question only",
  B: "rewritten queries only",
  C: "question + rewritten, in turns",
};

export const OPTION_KEYS = Object.keys(OPTIONS) as Option[];

const answerKeyPath = new URL("./answer-key.json", import.meta.url);

export const answerKey: AnswerKeyEntry[] = JSON.parse(
  readFileSync(answerKeyPath, "utf8"),
);

// The most recently added Ready book, or the one given.
export const findBook = async (sourceId?: string) => {
  const readyBooks = await db
    .select()
    .from(sources)
    .where(
      sourceId
        ? and(eq(sources.id, sourceId), eq(sources.state, "ready"))
        : eq(sources.state, "ready"),
    )
    .orderBy(desc(sources.createdAt))
    .limit(1);

  return readyBooks[0];
};

export const writeRewrittenQueries = async (question: string, book: Book) => {
  const books = `"${book.title}" by ${book.author}`;
  const { queries } = await searchQueriesChain.invoke({ books, question });

  return queries.slice(0, MAX_SEARCH_QUERIES);
};

export const searchQueriesFor = (
  option: Option,
  question: string,
  rewrittenQueries: string[],
) => {
  if (option === "A") {
    return [question];
  }

  if (option === "B") {
    return rewrittenQueries.length > 0 ? rewrittenQueries : [question];
  }

  return [question, ...rewrittenQueries];
};

// Runs a few items at a time, to stay well under the API's rate limits.
export const inGroups = async <Item, Result>(
  items: Item[],
  groupSize: number,
  run: (item: Item) => Promise<Result>,
) => {
  const results: Result[] = [];

  for (let start = 0; start < items.length; start += groupSize) {
    const group = items.slice(start, start + groupSize);
    const groupResults = await Promise.all(group.map(run));

    results.push(...groupResults);
  }

  return results;
};
