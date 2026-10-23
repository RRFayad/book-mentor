import { MAX_BOOK_PAGES } from "@app/shared/constants";
import { sources, User } from "@app/shared/db/schema";
import { desc, eq } from "drizzle-orm";
import { CreateSourceRequestBody } from "@app/shared/schemas";
import { db } from "../db";
import { HttpError } from "../errors";

export const createSource = async (
  data: CreateSourceRequestBody,
  user: User,
) => {
  if (data.kind === "book" && data.pageCount > MAX_BOOK_PAGES) {
    throw new HttpError(422, "too-large");
  }

  const result = await db
    .insert(sources)
    .values({ ...data, userId: user.id })
    .returning();

  return result;
};

export const getSourcesByUser = async (user: User) => {
  return db
    .select()
    .from(sources)
    .where(eq(sources.userId, user.id))
    .orderBy(desc(sources.createdAt));
};
