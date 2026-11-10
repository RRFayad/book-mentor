import { chunks, notes } from "@app/shared/db/schema";
import { PageText } from "@app/shared/schemas";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "../db";
import { embeddingModel } from "../ai-models";
import { notesChain, onePageChain } from "./ingestion.chains";

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// The batch as one text with [p. N] before each page, so the model can tell
// which page every line of a Note comes from.
const toMarkedPages = (pages: PageText[]) =>
  pages.map((page) => `[p. ${page.page}]\n${page.text}`).join("\n\n");

// A few uncovered pages are expected (part title pages, photos), more are not.
const MAX_UNCOVERED_PAGES = 5;

type PageRange = { firstPage: number; lastPage: number };

// Pages with text that no section covers.
const countUncoveredPages = (sections: PageRange[], pages: PageText[]) =>
  pages.filter(
    (page) =>
      !sections.some(
        (section) =>
          section.firstPage <= page.page && page.page <= section.lastPage,
      ),
  ).length;

// Try 2 times to write batch notes, when there are many uncovered pages
const writeSections = async (pages: PageText[]) => {
  const markedPages = toMarkedPages(pages);

  const firstTry = await notesChain.invoke({ pages: markedPages });
  const firstTryUncovered = countUncoveredPages(firstTry.sections, pages);

  if (firstTryUncovered <= MAX_UNCOVERED_PAGES) {
    return firstTry.sections;
  }

  console.log(
    `Pages ${pages[0].page}-${pages[pages.length - 1].page}: ${firstTryUncovered} pages in no Note, writing them again`,
  );

  const secondTry = await notesChain.invoke({ pages: markedPages });
  const secondTryUncovered = countUncoveredPages(secondTry.sections, pages);

  return secondTryUncovered < firstTryUncovered
    ? secondTry.sections
    : firstTry.sections;
};

// One Note per section in the batch. Its pages are kept inside the batch, so a
// retried batch finds the Notes it has to replace.
const writeNotes = async (sourceId: string, pages: PageText[]) => {
  if (pages.length === 0) {
    return [];
  }

  const batchFirstPage = pages[0].page;
  const batchLastPage = pages[pages.length - 1].page;
  const sections = await writeSections(pages);

  if (sections.length === 0) {
    return [];
  }

  const sectionTexts = sections.map(
    (section) => `${section.heading}\n${section.content}`,
  );
  const embeddings = await embeddingModel.embedDocuments(sectionTexts);

  return sections.map((section, index) => ({
    sourceId,
    heading: section.heading,
    firstPage: clamp(section.firstPage, batchFirstPage, batchLastPage),
    lastPage: clamp(section.lastPage, batchFirstPage, batchLastPage),
    content: section.content,
    embedding: embeddings[index],
  }));
};

// Replaces the batch's chunks and Notes in one transaction: a retried batch
// never leaves duplicates, and a failed insert leaves the old ones in place.
const storeBatch = async (
  sourceId: string,
  pages: PageText[],
  chunkRows: (typeof chunks.$inferInsert)[],
  noteRows: (typeof notes.$inferInsert)[],
) => {
  const batchPages = pages.map((page) => page.page);

  await db.transaction(async (tx) => {
    await tx
      .delete(chunks)
      .where(
        and(eq(chunks.sourceId, sourceId), inArray(chunks.page, batchPages)),
      );
    await tx
      .delete(notes)
      .where(
        and(eq(notes.sourceId, sourceId), inArray(notes.firstPage, batchPages)),
      );

    if (chunkRows.length > 0) {
      await tx.insert(chunks).values(chunkRows);
    }

    if (noteRows.length > 0) {
      await tx.insert(notes).values(noteRows);
    }
  });
};

export const ingestContent = async (sourceId: string, pages: PageText[]) => {
  const cleanedPages = cleanPages(pages);
  const { text, pageStarts } = toBatchText(cleanedPages);
  const chunkTexts = await textSplitter.splitText(text);
  const chunkStarts = findChunkStarts(text, chunkTexts);

  const [embeddings, noteRows] = await Promise.all([
    embeddingModel.embedDocuments(chunkTexts),
    writeNotes(sourceId, cleanedPages),
  ]);

  const chunkRows = chunkTexts.map((chunkText, index) => ({
    sourceId,
    page: pageAt(chunkStarts[index], cleanedPages, pageStarts),
    content: chunkText,
    embedding: embeddings[index],
  }));

  await storeBatch(sourceId, pages, chunkRows, noteRows);

  console.log(
    `Source ${sourceId}: pages ${pages[0].page}-${pages[pages.length - 1].page} → ${chunkRows.length} chunks, ${noteRows.length} notes stored`,
  );
};

// Built from the Notes, since a whole book doesn't fit in one prompt. If it
// fails, the book is still made Ready without one: answers work without it.
export const writeOnePage = async (sourceId: string) => {
  const bookNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.sourceId, sourceId))
    .orderBy(asc(notes.firstPage));

  if (bookNotes.length === 0) {
    return null;
  }

  const notesText = bookNotes
    .map(
      (note) =>
        `## ${note.heading} (pp. ${note.firstPage}–${note.lastPage})\n${note.content}`,
    )
    .join("\n\n");

  try {
    const { onePage } = await onePageChain.invoke({ notes: notesText });

    return onePage;
  } catch (error) {
    console.error(`Source ${sourceId}: writing the One Page failed`, error);

    return null;
  }
};
