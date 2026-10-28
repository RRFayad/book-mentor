import { chunks } from "@app/shared/db/schema";
import { EMBEDDING_DIMENSIONS } from "@app/shared/constants";
import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "../db";
import { createUser, startApi } from "../testing/api";

// Ticket #18: A book becomes ready.

let api: Awaited<ReturnType<typeof startApi>>;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

const pages = (from: number, to: number) => ({
  pages: Array.from({ length: to - from + 1 }, (_, index) => ({
    page: from + index,
    text: `Text of page ${from + index}. High-intensity training is brief.`,
  })),
});

// A reader with one Ingesting book of `pageCount` pages.
const addBook = async (pageCount = 4) => {
  await createUser("reader");

  const response = await api.as("reader").post("/sources", {
    kind: "book",
    title: "Heavy Duty",
    author: "Mike Mentzer",
    pageCount,
  });

  return response.data.source.id as string;
};

const chunksOf = (sourceId: string) =>
  db
    .select()
    .from(chunks)
    .where(eq(chunks.sourceId, sourceId))
    .orderBy(asc(chunks.page));

describe("sending a book's text in parts", () => {
  it("moves the progress with each part", async () => {
    const sourceId = await addBook(4);

    const first = await api
      .as("reader")
      .post(`/sources/${sourceId}/pages`, pages(1, 2));
    const second = await api
      .as("reader")
      .post(`/sources/${sourceId}/pages`, pages(3, 4));

    expect(first.status).toBe(200);
    expect(first.data).toEqual({ ingestionProgress: 50 });
    expect(second.data).toEqual({ ingestionProgress: 100 });
  });

  it("stores passages that remember their page number", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    const stored = await chunksOf(sourceId);

    expect(stored.map((chunk) => chunk.page)).toEqual([1, 2]);
    expect(stored[0].content).toContain("Text of page 1");
    expect(stored[0].embedding).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("keeps no passages for blank pages", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, {
      pages: [
        { page: 1, text: "Some text." },
        { page: 2, text: "   \n  " },
      ],
    });
    const stored = await chunksOf(sourceId);

    expect(stored.map((chunk) => chunk.page)).toEqual([1]);
  });

  it("doesn't duplicate passages when a part is sent again", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    const firstTime = await chunksOf(sourceId);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    const retried = await chunksOf(sourceId);

    expect(retried).toHaveLength(firstTime.length);
  });

  it("refuses an empty part", async () => {
    const sourceId = await addBook();

    const response = await api
      .as("reader")
      .post(`/sources/${sourceId}/pages`, { pages: [] });

    expect(response.status).toBe(422);
  });

  it("refuses parts for another reader's book", async () => {
    const sourceId = await addBook();
    await createUser("someone-else");

    const response = await api
      .as("someone-else")
      .post(`/sources/${sourceId}/pages`, pages(1, 2));

    expect(response.status).toBe(404);
    expect(await chunksOf(sourceId)).toEqual([]);
  });
});

describe("when every part has arrived", () => {
  // Sent exactly like the frontend: axios with an empty JSON body. With no
  // body, axios sends a form Content-Type and the API answers 415.
  it("makes the book Ready", async () => {
    const sourceId = await addBook(2);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));

    const response = await api
      .as("reader")
      .post(`/sources/${sourceId}/complete`, {});
    const library = await api.as("reader").get("/sources");

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({ id: sourceId, state: "ready" });
    expect(library.data[0].state).toBe("ready");
  });

  it("refuses more parts for a Ready book", async () => {
    const sourceId = await addBook(2);
    await api.as("reader").post(`/sources/${sourceId}/complete`, {});

    const response = await api
      .as("reader")
      .post(`/sources/${sourceId}/pages`, pages(1, 2));

    expect(response.status).toBe(409);
  });
});

describe("deleting a book", () => {
  it("deletes its passages too", async () => {
    const sourceId = await addBook(2);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));

    await api.as("reader").delete(`/sources/${sourceId}`);

    expect(await chunksOf(sourceId)).toEqual([]);
  });
});
