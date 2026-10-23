import { MAX_BOOK_PAGES } from "@app/shared/constants";
import { sources } from "@app/shared/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { CreateSourceRequestBody } from "@app/shared/schemas";
import { db } from "../db";
import { HttpError } from "../errors";

export const createSource = async (
  data: CreateSourceRequestBody,
  userId: number,
) => {
  if (data.kind === "book" && data.pageCount > MAX_BOOK_PAGES) {
    throw new HttpError(422, "too-large");
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
