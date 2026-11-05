import { chunks, notes } from "@app/shared/db/schema";
import { cosineDistance, eq } from "drizzle-orm";

import { db } from "../db";
import { embeddingModel } from "../ai-models";

// Enough passages to answer from, few enough to keep the prompt small.
const PASSAGE_COUNT = 6;

// Notes are long, and one usually covers the whole section a question is about.
const NOTE_COUNT = 2;

const closestChunks = (questionEmbedding: number[], sourceId: string) => {
  // How close a chunk is to the question, in vector space (lower = closer).
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

const closestNotes = (questionEmbedding: number[], sourceId: string) => {
  const distance = cosineDistance(notes.embedding, questionEmbedding);

  return db
    .select({
      heading: notes.heading,
      firstPage: notes.firstPage,
      lastPage: notes.lastPage,
      content: notes.content,
    })
    .from(notes)
    .where(eq(notes.sourceId, sourceId))
    .orderBy(distance)
    .limit(NOTE_COUNT);
};

// The chunks and Notes closest in meaning to the question, from one Source.
export const retrieveFromSourceId = async (
  question: string,
  sourceId: string,
) => {
  const questionEmbedding = await embeddingModel.embedQuery(question);

  const [passages, matchingNotes] = await Promise.all([
    closestChunks(questionEmbedding, sourceId),
    closestNotes(questionEmbedding, sourceId),
  ]);

  return { passages, notes: matchingNotes };
};
