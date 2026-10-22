import { MAX_BOOK_PAGES } from "@app/shared/constants";
import { sources, User } from "@app/shared/db/schema";
import { CreateSourceBody } from "@app/shared/schemas";
import { db } from "../db";
import { HttpError } from "../errors";

export const addSource = async (data: CreateSourceBody, user: User) => {
  if (data.kind === "book" && data.pageCount > MAX_BOOK_PAGES) {
    throw new HttpError(422, "too-large");
  }

  const result = await db
    .insert(sources)
    .values({ ...data, userId: user.id })
    .returning();

  return result;
};
