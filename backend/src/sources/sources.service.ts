import { MAX_BOOK_PAGES, SOURCE_LIMIT } from "@app/shared/constants";
import { sources, SourceRow } from "@app/shared/db/schema";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { CreateSourceRequestBody, PageText } from "@app/shared/schemas";
import { db } from "../db";
import { HttpError } from "../errors";
import { ingestContent } from "./ingestion.service";

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

// Expired Sources stay in the table until the cleanup job removes them, so
// only the ones not yet expired count.
const countActiveSourcesByUserId = async (userId: number) => {
  const [result] = await db
    .select({ total: count() })
    .from(sources)
    .where(and(eq(sources.userId, userId), gt(sources.expiresAt, new Date())));

  return result.total;
};

export const getSourcesByUserId = async (userId: number) => {
  return db
    .select()
    .from(sources)
    .where(eq(sources.userId, userId))
    .orderBy(desc(sources.createdAt));
};

export const deleteSourceByUserId = async (
  sourceId: string,
  userId: number,
) => {
  const deleted = await db
    .delete(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.userId, userId)))
    .returning({ id: sources.id });

  if (deleted.length === 0) {
    throw new HttpError(404, "Source not found");
  }
};

export const completeSourceIngestionByUserId = async (
  sourceId: string,
  userId: number,
) => {
  const [source] = await db
    .update(sources)
    .set({ state: "ready", ingestionProgress: 100 })
    .where(and(eq(sources.id, sourceId), eq(sources.userId, userId)))
    .returning();

  if (!source) {
    throw new HttpError(404, "Source not found");
  }

  return source;
};

export const ingestPagesByUserId = async (
  sourceId: string,
  userId: number,
  pages: PageText[],
) => {
  const source: SourceRow | undefined = await db.query.sources.findFirst({
    where: and(eq(sources.id, sourceId), eq(sources.userId, userId)),
  });

  if (!source) {
    throw new HttpError(404, "Source not found");
  }

  if (source.state !== "ingesting") {
    throw new HttpError(409, "Source is not ingesting");
  }

  await ingestContent(sourceId, pages);

  // Batches arrive in order, so the last page sent tells how far ingestion is.
  const lastPage = Math.max(...pages.map((page) => page.page));

  const ingestionProgress = source.pageCount
    ? Math.min(100, Math.round((lastPage / source.pageCount) * 100))
    : 0;

  await db
    .update(sources)
    .set({ ingestionProgress })
    .where(eq(sources.id, sourceId));

  return { ingestionProgress };
};
