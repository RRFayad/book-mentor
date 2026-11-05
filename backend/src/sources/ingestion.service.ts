import { chunks } from "@app/shared/db/schema";
import { PageText } from "@app/shared/schemas";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../db";
import { embeddingModel } from "../ai-models";

// ~1000 characters is a few paragraphs: enough context to make sense on its own,
// small enough that retrieval stays precise. The overlap keeps a sentence cut at a
// chunk boundary readable in both chunks.
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});

const cleanText = (text: string) =>
  text
    .replace(/-\n/g, "-") // hyphen + line break → keep the hyphen: "High-\nintensity" → "High-intensity"
    .replace(/[ \t]+/g, " ") // runs of spaces or tabs → one space
    .replace(/ *\n */g, "\n") // spaces around a line break → removed
    .replace(/\n{3,}/g, "\n\n") // more than one blank line → one blank line
    .trim();

// Pages left with no text (blank or image-only) are dropped.
const cleanPages = (pages: PageText[]) =>
  pages
    .map((page) => ({ ...page, text: cleanText(page.text) }))
    .filter((page) => page.text.length > 0);

// Joins lines that were broken in the middle of a sentence
const unwrapLines = (text: string) =>
  text.replace(/(?<=[^.!?:\n])\n(?=\p{Ll})/gu, " ");

const toBatchText = (pages: PageText[]) => {
  const pageStarts: number[] = [];
  let length = 0;

  for (const page of pages) {
    pageStarts.push(length);
    length += page.text.length + 1;
  }

  const joinedText = pages.map((page) => page.text).join("\n");
  const text = unwrapLines(joinedText);

  return { text, pageStarts };
};

const findChunkStarts = (text: string, chunkTexts: string[]) => {
  const starts: number[] = [];

  for (const chunkText of chunkTexts) {
    const previousStart = starts.at(-1) ?? -1;
    const start = text.indexOf(chunkText, previousStart + 1);

    starts.push(start === -1 ? Math.max(previousStart, 0) : start);
  }

  return starts;
};

// A chunk is cited by the page it starts on.
const pageAt = (position: number, pages: PageText[], pageStarts: number[]) => {
  const pageIndex = pageStarts.findLastIndex((start) => start <= position);

  return pages[pageIndex].page;
};

// Replaces the batch's chunks in one transaction: a retried batch never
// leaves duplicates, and a failed insert leaves the old chunks in place.
const storeChunks = async (
  sourceId: string,
  pages: PageText[],
  rows: (typeof chunks.$inferInsert)[],
) => {
  const batchPages = pages.map((page) => page.page);

  await db.transaction(async (tx) => {
    await tx
      .delete(chunks)
      .where(
        and(eq(chunks.sourceId, sourceId), inArray(chunks.page, batchPages)),
      );

    if (rows.length > 0) {
      await tx.insert(chunks).values(rows);
    }
  });
};

export const ingestContent = async (sourceId: string, pages: PageText[]) => {
  const cleanedPages = cleanPages(pages);
  const { text, pageStarts } = toBatchText(cleanedPages);
  const chunkTexts = await textSplitter.splitText(text);
  const chunkStarts = findChunkStarts(text, chunkTexts);

  const embeddings = await embeddingModel.embedDocuments(chunkTexts);

  const rows = chunkTexts.map((chunkText, index) => ({
    sourceId,
    page: pageAt(chunkStarts[index], cleanedPages, pageStarts),
    content: chunkText,
    embedding: embeddings[index],
  }));

  await storeChunks(sourceId, pages, rows);

  console.log(
    `Source ${sourceId}: pages ${pages[0].page}-${pages[pages.length - 1].page} → ${rows.length} chunks stored`,
  );
};
