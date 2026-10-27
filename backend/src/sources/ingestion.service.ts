import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@app/shared/constants";
import { chunks } from "@app/shared/db/schema";
import { PageText } from "@app/shared/schemas";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../db";

// ~1000 characters is a few paragraphs: enough context to make sense on its own,
// small enough that retrieval stays precise. The overlap keeps a sentence cut at a
// chunk boundary readable in both chunks.
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 150,
});

// Reads OPENAI_API_KEY from the environment.
const embeddingModel = new OpenAIEmbeddings({
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
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

// One Document per page. Every chunk split from it keeps this metadata, which is
// what citations show later (Source and page).
const toDocuments = (sourceId: string, pages: PageText[]) =>
  pages.map(
    (page) =>
      new Document({
        pageContent: page.text,
        metadata: { sourceId, page: page.page },
      }),
  );

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
  const documents = toDocuments(sourceId, cleanedPages);
  const pageChunks = await textSplitter.splitDocuments(documents);
  const chunkTexts = pageChunks.map((chunk) => chunk.pageContent);

  const embeddings = await embeddingModel.embedDocuments(chunkTexts);

  const rows = pageChunks.map((chunk, index) => ({
    sourceId,
    page: chunk.metadata.page,
    content: chunk.pageContent,
    embedding: embeddings[index],
  }));

  await storeChunks(sourceId, pages, rows);

  console.log(
    `Source ${sourceId}: pages ${pages[0].page}-${pages[pages.length - 1].page} → ${rows.length} chunks stored`,
  );
};
