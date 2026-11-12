import { EMBEDDING_DIMENSIONS } from "@app/shared/constants";
import { chunks, notes, sources } from "@app/shared/db/schema";
import { eq } from "drizzle-orm";
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

const CRON_SECRET = "test-cron-secret";
const DAY = 24 * 60 * 60 * 1000;

let api: Awaited<ReturnType<typeof startApi>>;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// A Ready book with one passage, one Note, and its One Page.
const saveBook = async (userId: number, expiresAt: Date) => {
  const embedding = Array(EMBEDDING_DIMENSIONS).fill(0.1);

  const [book] = await db
    .insert(sources)
    .values({
      userId,
      kind: "book",
      title: "Meditations",
      author: "Marcus Aurelius",
      pageCount: 10,
      state: "ready",
      onePage: "The book's big picture.",
      expiresAt,
    })
    .returning();

  await db
    .insert(chunks)
    .values({ sourceId: book.id, page: 1, content: "A passage.", embedding });
  await db.insert(notes).values({
    sourceId: book.id,
    heading: "Book One",
    firstPage: 1,
    lastPage: 10,
    content: "A Note.",
    embedding,
  });

  return book.id;
};

const runJob = (authorization?: string) =>
  api.as().get("/cron/delete-expired-sources", {
    headers: authorization ? { authorization } : {},
  });

describe("deleting expired Sources", () => {
  it("deletes an expired book's text, and keeps its title for its Conversations", async () => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    const user = await createUser("reader");
    const expiredId = await saveBook(user.id, new Date(Date.now() - DAY));
    const freshId = await saveBook(user.id, new Date(Date.now() + DAY));

    const response = await runJob(`Bearer ${CRON_SECRET}`);
    const [expired] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, expiredId));

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ deletedPassages: 1 });
    expect(expired).toMatchObject({ title: "Meditations", onePage: null });
    expect(
      await db.select().from(chunks).where(eq(chunks.sourceId, expiredId)),
    ).toEqual([]);
    expect(
      await db.select().from(notes).where(eq(notes.sourceId, expiredId)),
    ).toEqual([]);
    expect(
      await db.select().from(chunks).where(eq(chunks.sourceId, freshId)),
    ).toHaveLength(1);
  });

  it("deletes nothing new when it runs twice", async () => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    const user = await createUser("reader");
    await saveBook(user.id, new Date(Date.now() - DAY));

    await runJob(`Bearer ${CRON_SECRET}`);
    const second = await runJob(`Bearer ${CRON_SECRET}`);

    expect(second.data).toEqual({ deletedPassages: 0 });
  });

  it("refuses a call without the secret, and deletes nothing", async () => {
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    const user = await createUser("reader");
    const expiredId = await saveBook(user.id, new Date(Date.now() - DAY));

    const response = await runJob("Bearer wrong-secret");

    expect(response.status).toBe(401);
    expect(
      await db.select().from(chunks).where(eq(chunks.sourceId, expiredId)),
    ).toHaveLength(1);
  });
});
