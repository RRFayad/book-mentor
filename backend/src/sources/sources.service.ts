import { MAX_BOOK_PAGES, SOURCE_LIMIT } from "@app/shared/constants";
import {
  chunks,
  conversationSources,
  notes,
  sources,
  SourceRow,
} from "@app/shared/db/schema";
import { and, count, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { CreateSourceRequestBody, PageText } from "@app/shared/schemas";
import { db } from "../db";
import { HttpError } from "../errors";
import { ingestContent, writeOnePage } from "./ingestion.service";

// Expired Sources stay in the table until the cleanup job removes them, so
// only the ones not yet expired count.
const countActiveSourcesByUserId = async (userId: number) => {
  const [result] = await db
    .select({ total: count() })
    .from(sources)
    .where(and(eq(sources.userId, userId), gt(sources.expiresAt, new Date())));

  return result.total;
};

export const createSource = async (
  data: CreateSourceRequestBody,
  userId: number,
) => {
  if (data.kind === "book" && data.pageCount > MAX_BOOK_PAGES) {
    throw new HttpError(422, "too-large");
  }

  // TODO
  if (data.kind === "blog") {
    throw new HttpError(422, "Blogs aren't supported yet");
  }

  const activeSources = await countActiveSourcesByUserId(userId);

  if (activeSources >= SOURCE_LIMIT) {
    throw new HttpError(409, "limit-reached");
  }

  const result = await db
    .insert(sources)
    .values({ ...data, userId })
    .returning();

  return result;
};

export const getSourcesByUserId = async (userId: number) => {
  return db
    .select()
    .from(sources)
    .where(and(eq(sources.userId, userId), gt(sources.expiresAt, new Date())))
    .orderBy(desc(sources.createdAt));
};

// Deleting = expiring now, so its Conversations show it as expired.
export const deleteSourceByUserId = async (
  sourceId: string,
  userId: number,
) => {
  const expired = await db
    .update(sources)
    .set({ expiresAt: new Date(), onePage: null })
    .where(and(eq(sources.id, sourceId), eq(sources.userId, userId)))
    .returning({ id: sources.id });

  if (expired.length === 0) {
    throw new HttpError(404, "Source not found");
  }

  await db.delete(chunks).where(eq(chunks.sourceId, sourceId));
  await db.delete(notes).where(eq(notes.sourceId, sourceId));
};

// How many Conversations use each of the reader's Sources, by Source id.
export const countConversationsBySourceByUserId = async (userId: number) => {
  const counts = await db
    .select({ sourceId: conversationSources.sourceId, total: count() })
    .from(conversationSources)
    .innerJoin(sources, eq(conversationSources.sourceId, sources.id))
    .where(eq(sources.userId, userId))
    .groupBy(conversationSources.sourceId);

  return Object.fromEntries(counts.map((row) => [row.sourceId, row.total]));
};

// A reader's Source that hasn't expired (or been deleted).
const findActiveSourceByUserId = async (sourceId: string, userId: number) => {
  const source: SourceRow | undefined = await db.query.sources.findFirst({
    where: and(
      eq(sources.id, sourceId),
      eq(sources.userId, userId),
      gt(sources.expiresAt, new Date()),
    ),
  });

  if (!source) {
    throw new HttpError(404, "Source not found");
  }

  return source;
};

export const completeSourceIngestionByUserId = async (
  sourceId: string,
  userId: number,
) => {
  const source = await findActiveSourceByUserId(sourceId, userId);

  if (source.state !== "ingesting") {
    throw new HttpError(409, "Source is not ingesting");
  }

  const onePage = await writeOnePage(sourceId);

  const [readySource] = await db
    .update(sources)
    .set({ state: "ready", ingestionProgress: 100, onePage })
    .where(eq(sources.id, sourceId))
    .returning();

  return readySource;
};

export const ingestPagesByUserId = async (
  sourceId: string,
  userId: number,
  pages: PageText[],
) => {
  const source = await findActiveSourceByUserId(sourceId, userId);

  if (source.state !== "ingesting") {
    throw new HttpError(409, "Source is not ingesting");
  }

  await ingestContent(sourceId, pages);

  const lastPage = Math.max(...pages.map((page) => page.page));

  const batchProgress = source.pageCount
    ? Math.min(100, Math.round((lastPage / source.pageCount) * 100))
    : 0;

  // Batches are sent a few at once and can finish out of order, so progress
  // only moves forward.
  const [updated] = await db
    .update(sources)
    .set({
      ingestionProgress: sql`greatest(${sources.ingestionProgress}, ${batchProgress})`,
    })
    .where(eq(sources.id, sourceId))
    .returning({ ingestionProgress: sources.ingestionProgress });

  return { ingestionProgress: updated.ingestionProgress };
};

export const deleteExpiredSourcesText = async () => {
  const now = new Date();
  const expiredSourceIds = db
    .select({ id: sources.id })
    .from(sources)
    .where(lt(sources.expiresAt, now));

  return db.transaction(async (tx) => {
    const deletedPassages = await tx
      .delete(chunks)
      .where(inArray(chunks.sourceId, expiredSourceIds))
      .returning({ id: chunks.id });

    await tx.delete(notes).where(inArray(notes.sourceId, expiredSourceIds));

    await tx
      .update(sources)
      .set({ onePage: null })
      .where(lt(sources.expiresAt, now));

    return deletedPassages.length;
  });
};
