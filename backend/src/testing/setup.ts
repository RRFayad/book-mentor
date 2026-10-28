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

// OpenAI: fake vectors of the real size, so tests are free, fast, and offline.
vi.mock("@langchain/openai", async () => {
  const { EMBEDDING_DIMENSIONS } = await import("@app/shared/constants");
  const fakeVector = () => Array<number>(EMBEDDING_DIMENSIONS).fill(0.01);

  return {
    OpenAIEmbeddings: class {
      embedDocuments = async (texts: string[]) => texts.map(fakeVector);
      embedQuery = async () => fakeVector();
    },
  };
});

// Every test starts from an empty database.
beforeEach(async () => {
  await db.execute(
    sql`truncate table chunks, sources, subscriptions, users restart identity cascade`,
  );
});
