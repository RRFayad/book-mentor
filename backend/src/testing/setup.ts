import { sql } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import { beforeEach, vi } from "vitest";

import { db } from "../db";

// Clerk: the x-test-user header stands in for a verified session token, so a
// test signs in as any Clerk user ID. authenticate still loads the user row.
vi.mock("@clerk/fastify", () => ({
  clerkPlugin: async () => {},
  getAuth: (request: FastifyRequest) => {
    const clerkId = request.headers["x-test-user"];

    return typeof clerkId === "string"
      ? { isAuthenticated: true, userId: clerkId }
      : { isAuthenticated: false, userId: null };
  },
}));

// OpenAI: fake vectors of the real size, a fixed answer citing passage 1, one
// fixed Note per batch, and a fixed One Page, so tests are free, fast, and offline.
vi.mock("@langchain/openai", async () => {
  const { EMBEDDING_DIMENSIONS } = await import("@app/shared/constants");
  const { RunnableLambda } = await import("@langchain/core/runnables");
  const fakeVector = () => Array<number>(EMBEDDING_DIMENSIONS).fill(0.01);

  const FAKE_NOTES = {
    sections: [
      {
        heading: "Training Briefly",
        firstPage: 1,
        lastPage: 2,
        content: "Train briefly. (p. 1)\nRest fully. (p. 2)",
      },
    ],
  };
  const FAKE_ONE_PAGE = { onePage: "The book is about training briefly." };
  const FAKE_SEARCH_QUERIES = {
    tooManyQuestions: false,
    followsUp: false,
    queries: ["training briefly"],
  };
  const FAKE_ANSWER = { covered: true, answer: "The Source says this [1]." };
  const fakeReplyFor = (shape: object) => {
    if ("sections" in shape) {
      return FAKE_NOTES;
    }

    if ("onePage" in shape) {
      return FAKE_ONE_PAGE;
    }

    if ("queries" in shape) {
      return FAKE_SEARCH_QUERIES;
    }

    return FAKE_ANSWER;
  };

  return {
    OpenAIEmbeddings: class {
      embedDocuments = async (texts: string[]) => texts.map(fakeVector);
      embedQuery = async () => fakeVector();
    },
    ChatOpenAI: class {
      withStructuredOutput = (schema: { shape: object }) =>
        RunnableLambda.from(async () => fakeReplyFor(schema.shape));
    },
  };
});

// Every test starts from an empty database.
beforeEach(async () => {
  await db.execute(
    sql`truncate table notes, chunks, sources, subscriptions, users restart identity cascade`,
  );
});
