import { ChunkRow, NoteRow, SourceRow } from "@app/shared/db/schema";
import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

import { answerChain, answerSchema, searchQueriesChain } from "./mentor.chains";
import { formatNotes, formatPassages } from "./mentor.utils";
import {
  MAX_SEARCH_QUERIES,
  PASSAGE_COUNT,
  RETRY_PASSAGE_COUNT,
  retrieveFromSourceId,
} from "./retrieval.service";

// Extra tries when the answer isn't covered but the question isn't off-topic.
const MAX_RETRIES = 2; // + the original attempt

type Book = Pick<SourceRow, "title" | "author">;

export type Passage = Pick<ChunkRow, "sourceId" | "page" | "content"> & Book;

export type Note = Pick<
  NoteRow,
  "heading" | "firstPage" | "lastPage" | "content"
> &
  Book;

// Nodes shared state
const MentorState = new StateSchema({
  question: z.string(), //Original question
  sources: z.array(z.custom<SourceRow>()), // Sources to search for passages and notes
  books: z.string(), // Book titles and authors, for the model to refer to in queries and answers
  onePages: z.string(), // One Page (book summary)
  recentMessages: z.string(), // Recent messages for context

  tooManyQuestions: z.boolean(), // Whether the question has too many parts to answer in one go
  followsUp: z.boolean(), // Whether the question needs recentMesssages for context
  searchQueries: z.array(z.string()), // Search queries written by the model to find passages and notes
  triedQueries: z.array(z.string()).default([]), // Rewritten queries from earlier tries, so a retry searches differently

  passages: z.array(z.custom<Passage>()), // Passages retrieved from the sources
  notes: z.array(z.custom<Note>()), // Notes (created by the model during ingestion)

  reply: answerSchema,
  searchAttempts: z.number().default(0), // How many times the search ran, for the retry limit
});

type MentorState = typeof MentorState.State;
type MentorUpdate = typeof MentorState.Update; // Only fields that are updated in the state

const writeSearchQueriesNode = async (
  state: MentorState,
): Promise<MentorUpdate> => {
  const { tooManyQuestions, followsUp, queries } =
    await searchQueriesChain.invoke({
      books: state.books,
      onePages: state.onePages,
      recentMessages: state.recentMessages,
      triedQueries: state.triedQueries.join("\n") || "None.",
      question: state.question,
    });

  const rewrittenQueries = queries.slice(0, MAX_SEARCH_QUERIES);

  // A retry drops the question: it already failed, and it would fill half the
  // passages with the same ones again.
  const isRetry = state.searchAttempts > 0 && rewrittenQueries.length > 0;
  const searchQueries = isRetry
    ? rewrittenQueries
    : [state.question, ...rewrittenQueries];

  const triedQueries = [...state.triedQueries, ...rewrittenQueries];
  const searchAttempts = state.searchAttempts + 1;

  return {
    tooManyQuestions,
    followsUp,
    searchQueries,
    triedQueries,
    searchAttempts,
  };
};

const retrieveFromSourcesNode = async (
  state: MentorState,
): Promise<MentorUpdate> => {
  const isRetry = state.searchAttempts > 1;
  const passageCount = isRetry ? RETRY_PASSAGE_COUNT : PASSAGE_COUNT;

  const retrievedPerSource = await Promise.all(
    state.sources.map(async (source) => {
      const retrieved = await retrieveFromSourceId(
        state.searchQueries,
        source.id,
        passageCount,
      );
      const book = { title: source.title, author: source.author };

      const passagesInBookOrder = retrieved.passages.toSorted(
        (a, b) => (a.page ?? 0) - (b.page ?? 0),
      );
      const notesInBookOrder = retrieved.notes.toSorted(
        (a, b) => a.firstPage - b.firstPage,
      );

      return {
        passages: passagesInBookOrder.map((row) => ({ ...row, ...book })),
        notes: notesInBookOrder.map((note) => ({ ...note, ...book })),
      };
    }),
  );
  const passages = retrievedPerSource.flatMap(
    (retrieved) => retrieved.passages,
  );
  const notes = retrievedPerSource.flatMap((retrieved) => retrieved.notes);

  return { passages, notes };
};

const writeAnswerNode = async (state: MentorState): Promise<MentorUpdate> => {
  const reply = await answerChain.invoke({
    onePages: state.onePages,
    notes: formatNotes(state.notes) || "None.",
    passages: formatPassages(state.passages),
    recentMessages: state.followsUp ? state.recentMessages : "None.", // If the question doesn't follow up on recent messages, don't give them to the model
    question: state.question,
  });

  return { reply };
};

// TODO: remove once a message is split into separate questions.
const endIfTooManyQuestionsEdge = (state: MentorState) =>
  state.tooManyQuestions ? END : "retrieveFromSources";

// Search again when the book could answer but the search missed: not for an
// off-topic question, which no search would find.
const retryIfNotCoveredEdge = (state: MentorState) => {
  const { covered, offTopic } = state.reply;
  const retriesDone = state.searchAttempts - 1;
  const shouldRetry = !covered && !offTopic && retriesDone < MAX_RETRIES;

  return shouldRetry ? "writeSearchQueries" : END;
};

export const mentorGraph = new StateGraph(MentorState)
  .addNode("writeSearchQueries", writeSearchQueriesNode)
  .addNode("retrieveFromSources", retrieveFromSourcesNode)
  .addNode("writeAnswer", writeAnswerNode)
  .addEdge(START, "writeSearchQueries")
  .addConditionalEdges("writeSearchQueries", endIfTooManyQuestionsEdge, [
    "retrieveFromSources",
    END,
  ])
  .addEdge("retrieveFromSources", "writeAnswer")
  .addConditionalEdges("writeAnswer", retryIfNotCoveredEdge, [
    "writeSearchQueries",
    END,
  ])
  .compile({ name: "Mentor" });
