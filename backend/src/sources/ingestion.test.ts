import { chunks, notes, sources } from "@app/shared/db/schema";
import {
  EMBEDDING_DIMENSIONS,
  MAX_PAGE_TEXT_LENGTH,
} from "@app/shared/constants";
import { asc, eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { db } from "../db";
import { createUser, startApi } from "../testing/api";
import { notesChain } from "./ingestion.chains";

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

const notesOf = (sourceId: string) =>
  db.select().from(notes).where(eq(notes.sourceId, sourceId));

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

  it("never moves the progress back when parts finish out of order", async () => {
    const sourceId = await addBook(4);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(3, 4));
    const earlier = await api
      .as("reader")
      .post(`/sources/${sourceId}/pages`, pages(1, 2));

    expect(earlier.data).toEqual({ ingestionProgress: 100 });
  });

  it("stores passages that remember the page they start on", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, {
      pages: [
        { page: 1, text: "Train briefly. ".repeat(80) },
        { page: 2, text: "Rest fully. ".repeat(80) },
      ],
    });
    const stored = await chunksOf(sourceId);

    expect(stored.at(0)?.page).toBe(1);
    expect(stored.at(-1)?.page).toBe(2);
    expect(stored.at(-1)?.content).toContain("Rest fully.");
    expect(stored[0].embedding).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("keeps a sentence cut by a page break whole, cited by the page it starts on", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, {
      pages: [
        { page: 1, text: "Curl the legs as high as they" },
        { page: 2, text: "can go.\nPause at the top." },
      ],
    });
    const stored = await chunksOf(sourceId);

    expect(stored).toHaveLength(1);
    expect(stored[0].page).toBe(1);
    expect(stored[0].content).toBe(
      "Curl the legs as high as they can go.\nPause at the top.",
    );
  });

  it("writes the Mentor's Notes on the part's sections", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    const stored = await notesOf(sourceId);

    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      heading: "Training Briefly",
      firstPage: 1,
      lastPage: 2,
      content: "Train briefly. (p. 1)\nRest fully. (p. 2)",
    });
    expect(stored[0].embedding).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  // The fake model always answers pages 1-2, whatever part it reads.
  it("keeps a Note's pages inside its part", async () => {
    const sourceId = await addBook(4);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(3, 4));
    const stored = await notesOf(sourceId);

    expect(stored[0]).toMatchObject({ firstPage: 3, lastPage: 3 });
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

  it("doesn't duplicate passages or Notes when a part is sent again", async () => {
    const sourceId = await addBook(2);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    const firstTime = await chunksOf(sourceId);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    const retried = await chunksOf(sourceId);

    expect(retried).toHaveLength(firstTime.length);
    expect(await notesOf(sourceId)).toHaveLength(1);
  });

  it("refuses an empty part", async () => {
    const sourceId = await addBook();

    const response = await api
      .as("reader")
      .post(`/sources/${sourceId}/pages`, { pages: [] });

    expect(response.status).toBe(422);
  });

  it("refuses a page with more text than a book page holds", async () => {
    const sourceId = await addBook();
    const longText = "a".repeat(MAX_PAGE_TEXT_LENGTH + 1);

    const response = await api.as("reader").post(`/sources/${sourceId}/pages`, {
      pages: [{ page: 1, text: longText }],
    });

    expect(response.status).toBe(422);
    expect(await chunksOf(sourceId)).toEqual([]);
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

describe("when the Notes skip pages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const section = (firstPage: number, lastPage: number) => ({
    heading: "Training Briefly",
    firstPage,
    lastPage,
    content: "Train briefly.",
  });

  it("writes them once more and keeps the try that covers more", async () => {
    const invoke = vi
      .spyOn(notesChain, "invoke")
      .mockResolvedValueOnce({ sections: [section(1, 2)] })
      .mockResolvedValueOnce({ sections: [section(1, 10)] });
    const sourceId = await addBook(10);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 10));
    const stored = await notesOf(sourceId);

    expect(invoke).toHaveBeenCalledTimes(2);
    expect(stored[0]).toMatchObject({ firstPage: 1, lastPage: 10 });
  });

  it("writes them once when only a few pages are skipped", async () => {
    const invoke = vi
      .spyOn(notesChain, "invoke")
      .mockResolvedValueOnce({ sections: [section(1, 6)] });
    const sourceId = await addBook(10);

    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 10));

    expect(invoke).toHaveBeenCalledTimes(1);
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

  it("refuses to complete a book that's already Ready", async () => {
    const sourceId = await addBook(2);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));
    await api.as("reader").post(`/sources/${sourceId}/complete`, {});

    const again = await api
      .as("reader")
      .post(`/sources/${sourceId}/complete`, {});

    expect(again.status).toBe(409);
  });

  it("writes the book's One Page from its Notes, kept out of the Library", async () => {
    const sourceId = await addBook(2);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));

    await api.as("reader").post(`/sources/${sourceId}/complete`, {});
    const [book] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId));
    const library = await api.as("reader").get("/sources");

    expect(book.onePage).toBe("The book is about training briefly.");
    expect(library.data[0]).not.toHaveProperty("onePage");
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
  it("deletes its passages and Notes too", async () => {
    const sourceId = await addBook(2);
    await api.as("reader").post(`/sources/${sourceId}/pages`, pages(1, 2));

    await api.as("reader").delete(`/sources/${sourceId}`);

    expect(await chunksOf(sourceId)).toEqual([]);
    expect(await notesOf(sourceId)).toEqual([]);
  });
});
