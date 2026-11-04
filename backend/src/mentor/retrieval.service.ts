import { chunks } from "@app/shared/db/schema";
import { cosineDistance, eq } from "drizzle-orm";

import { db } from "../db";
import { embeddingModel } from "../embedding-model";

// Enough passages to answer from, few enough to keep the prompt small.
const PASSAGE_COUNT = 6;

// The chunks closest in meaning to the question, from the given Sources only.
export const retrieveFromSourceId = async (
  question: string,
  sourceId: string,
) => {
  const questionEmbedding = await embeddingModel.embedQuery(question);

  //How close a chunk is to the question, in vector space (lower = closer).
  const distance = cosineDistance(chunks.embedding, questionEmbedding);

  return db
    .select({
      sourceId: chunks.sourceId,
      page: chunks.page,
      content: chunks.content,
    })
    .from(chunks)
    .where(eq(chunks.sourceId, sourceId))
    .orderBy(distance)
    .limit(PASSAGE_COUNT);
};
