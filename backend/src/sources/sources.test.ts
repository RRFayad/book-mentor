import { sources } from "@app/shared/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "../db";
import { createUser, startApi } from "../testing/api";

// Ticket #17: Your Library is saved.

const book = (title = "Heavy Duty", pageCount = 120) => ({
  kind: "book",
  title,
  author: "Mike Mentzer",
  pageCount,
});

let api: Awaited<ReturnType<typeof startApi>>;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

describe("adding a book", () => {
  it("saves it as Ingesting, with its title, author, and page count", async () => {
    await createUser("reader");

    const response = await api.as("reader").post("/sources", book());

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      status: "added",
      source: {
        kind: "book",
        title: "Heavy Duty",
        author: "Mike Mentzer",
        pageCount: 120,
        state: "ingesting",
        ingestionProgress: 0,
      },
    });
  });

  it("refuses a book over 500 pages, and saves nothing", async () => {
    await createUser("reader");

    const response = await api.as("reader").post("/sources", book("Huge", 501));
    const library = await api.as("reader").get("/sources");

    expect(response.status).toBe(422);
    expect(response.data).toEqual({ detail: "too-large" });
    expect(library.data).toEqual([]);
  });

  it("refuses a 4th active Source", async () => {
    await createUser("reader");

    for (const title of ["One", "Two", "Three"]) {
      await api.as("reader").post("/sources", book(title));
    }

    const response = await api.as("reader").post("/sources", book("Four"));

    expect(response.status).toBe(409);
    expect(response.data).toEqual({ detail: "limit-reached" });
  });

  it("doesn't count expired Sources toward the limit", async () => {
    const user = await createUser("reader");
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await db.insert(sources).values(
      ["One", "Two", "Three"].map((title) => ({
        userId: user.id,
        kind: "book" as const,
        title,
        author: "Someone",
        pageCount: 10,
        expiresAt: yesterday,
      })),
    );

    const response = await api.as("reader").post("/sources", book());

    expect(response.status).toBe(201);
  });

  it("refuses blogs until they're supported (#21)", async () => {
    await createUser("reader");

    const response = await api.as("reader").post("/sources", {
      kind: "blog",
      address: "https://www.example.com/",
      title: "A blog",
      author: "Someone",
    });

    expect(response.status).toBe(422);
  });

  it("refuses an invalid body", async () => {
    await createUser("reader");

    const response = await api.as("reader").post("/sources", { kind: "book" });

    expect(response.status).toBe(422);
    expect(response.data.detail).toEqual(expect.any(String));
  });
});

describe("the Library", () => {
  it("lists the reader's own Sources, and only theirs", async () => {
    await createUser("reader");
    await createUser("someone-else");
    await api.as("reader").post("/sources", book("Mine"));
    await api.as("someone-else").post("/sources", book("Theirs"));

    const response = await api.as("reader").get("/sources");

    expect(response.status).toBe(200);
    expect(
      response.data.map((source: { title: string }) => source.title),
    ).toEqual(["Mine"]);
  });

  it("leaves out expired Sources", async () => {
    const user = await createUser("reader");
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db.insert(sources).values({
      userId: user.id,
      kind: "book",
      title: "Expired",
      author: "Someone",
      pageCount: 10,
      expiresAt: yesterday,
    });

    const library = await api.as("reader").get("/sources");

    expect(library.data).toEqual([]);
  });

  it("shows the same Sources after a reload, newest first", async () => {
    await createUser("reader");
    await api.as("reader").post("/sources", book("First"));
    await api.as("reader").post("/sources", book("Second"));

    const firstLoad = await api.as("reader").get("/sources");
    const reload = await api.as("reader").get("/sources");

    expect(reload.data).toEqual(firstLoad.data);
    expect(
      reload.data.map((source: { title: string }) => source.title),
    ).toEqual(["Second", "First"]);
  });

  it("never sends the owner's user ID", async () => {
    await createUser("reader");
    await api.as("reader").post("/sources", book());

    const response = await api.as("reader").get("/sources");

    expect(response.data[0]).not.toHaveProperty("userId");
  });
});

// A Ready book, saved straight to the database, so a Conversation can use it.
const saveReadyBook = async (userId: number, title = "Meditations") => {
  const [saved] = await db
    .insert(sources)
    .values({
      userId,
      kind: "book",
      title,
      author: "Marcus Aurelius",
      pageCount: 10,
      state: "ready",
    })
    .returning();

  return saved;
};

const startConversation = (sourceId: string, clerkId = "reader") =>
  api.as(clerkId).post("/conversations", {
    sourceIds: [sourceId],
    firstQuestion: "What is the main idea?",
  });

describe("deleting a Source", () => {
  it("removes it from the reader's Library", async () => {
    await createUser("reader");
    const created = await api.as("reader").post("/sources", book());

    const response = await api
      .as("reader")
      .delete(`/sources/${created.data.source.id}`);
    const library = await api.as("reader").get("/sources");

    expect(response.status).toBe(204);
    expect(library.data).toEqual([]);
  });

  it("keeps it in its Conversations, shown as expired", async () => {
    const user = await createUser("reader");
    const saved = await saveReadyBook(user.id);
    const started = await startConversation(saved.id);

    await api.as("reader").delete(`/sources/${saved.id}`);
    const conversation = await api
      .as("reader")
      .get(`/conversations/${started.data.conversationId}`);

    expect(conversation.data.sources).toEqual([
      expect.objectContaining({ id: saved.id, expired: true }),
    ]);
  });

  it("can't delete another reader's Source", async () => {
    await createUser("reader");
    await createUser("someone-else");
    const created = await api.as("reader").post("/sources", book());

    const response = await api
      .as("someone-else")
      .delete(`/sources/${created.data.source.id}`);
    const library = await api.as("reader").get("/sources");

    expect(response.status).toBe(404);
    expect(library.data).toHaveLength(1);
  });
});

describe("access", () => {
  it("refuses a signed-out request", async () => {
    const response = await api.as().get("/sources");

    expect(response.status).toBe(401);
  });

  it("refuses a signed-in user with no users row", async () => {
    const response = await api.as("never-synced").get("/sources");

    expect(response.status).toBe(404);
    expect(response.data).toEqual({ detail: "User not found" });
  });
});

describe("counting Conversations per Source", () => {
  it("counts the reader's Conversations for each of their Sources", async () => {
    const user = await createUser("reader");
    const used = await saveReadyBook(user.id, "Used");
    await saveReadyBook(user.id, "Unused");
    await startConversation(used.id);
    await startConversation(used.id);

    const response = await api.as("reader").get("/sources/conversation-counts");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ [used.id]: 2 });
  });

  it("doesn't count another reader's Conversations", async () => {
    const other = await createUser("someone-else");
    const theirs = await saveReadyBook(other.id);
    await startConversation(theirs.id, "someone-else");
    await createUser("reader");

    const response = await api.as("reader").get("/sources/conversation-counts");

    expect(response.data).toEqual({});
  });
});
