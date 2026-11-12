import { chunks, notes } from "@app/shared/db/schema";
import { cosineDistance, eq } from "drizzle-orm";

import { db } from "../db";
import { embeddingModel } from "../ai-models";

//----------------- Retrieval Limits -----------------//

//There is a relationship between the number of queries allowed and the number of passages and notes retrieved per query.
// The more queries, the fewer passages and notes per query, but the total number of passages and notes retrieved is capped by the constants below.
export const MAX_SEARCH_QUERIES = 2;

// Enough passages to answer from, few enough to keep the prompt small.
export const PASSAGE_COUNT = MAX_SEARCH_QUERIES * 3;

// A retry looks deeper: a passage the first try missed often ranks just below.
export const RETRY_PASSAGE_COUNT = 10;

// Notes are long, and one usually covers the whole section a question is about.
const NOTE_COUNT = MAX_SEARCH_QUERIES * 2;

//----------------------------------------------------//

const closestChunks = (
  queryEmbedding: number[],
  sourceId: string,
  passageCount: number,
) => {
  // How close a chunk is to the query, in vector space (lower = closer).
  const distance = cosineDistance(chunks.embedding, queryEmbedding);

  return db
    .select({
      id: chunks.id,
      sourceId: chunks.sourceId,
      page: chunks.page,
      content: chunks.content,
    })
    .from(chunks)
    .where(eq(chunks.sourceId, sourceId))
    .orderBy(distance)
    .limit(passageCount);
};

const closestNotes = (queryEmbedding: number[], sourceId: string) => {
  const distance = cosineDistance(notes.embedding, queryEmbedding);

  return db
    .select({
      id: notes.id,
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

// Takes each query's best result in turns (Query A 1st, Query B 1st, Query C 1st, Query A 2nd, Query B 2nd, ...), until the limit is reached.
const mergeAndCapClosestResults = <Row extends { id: string }>(
  resultsPerQuery: Row[][],
  limit: number,
) => {
  const taken = new Map<string, Row>();
  const longest = Math.max(...resultsPerQuery.map((results) => results.length));

  for (let rank = 0; rank < longest; rank++) {
    for (const results of resultsPerQuery) {
      const row = results[rank];

      if (row && taken.size < limit && !taken.has(row.id)) {
        taken.set(row.id, row);
      }
    }
  }

  return [...taken.values()];
};

export const retrieveFromSourceId = async (
  searchQueries: string[],
  sourceId: string,
  passageCount: number,
) => {
  const searchQueryEmbeddings = await Promise.all(
    searchQueries.map((searchQuery) => embeddingModel.embedQuery(searchQuery)),
  );

  const chunkSearches = searchQueryEmbeddings.map((embedding) =>
    closestChunks(embedding, sourceId, passageCount),
  );
  const noteSearches = searchQueryEmbeddings.map((embedding) =>
    closestNotes(embedding, sourceId),
  );

  const chunksPerQuery = await Promise.all(chunkSearches);
  const notesPerQuery = await Promise.all(noteSearches);

  const passages = mergeAndCapClosestResults(chunksPerQuery, passageCount);
  const matchingNotes = mergeAndCapClosestResults(notesPerQuery, NOTE_COUNT);

  return { passages, notes: matchingNotes };
};
