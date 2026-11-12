import { MESSAGE_LIMIT } from "@app/shared/constants";
import { messages, NewMessageRow, sources } from "@app/shared/db/schema";
import { SendMessageRequestBody } from "@app/shared/schemas";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "../db";
import { createUser, startApi } from "../testing/api";
import { answerQuestion } from "../mentor/mentor.service";

// The real answer by default; a test can make it fail once.
vi.mock("../mentor/mentor.service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../mentor/mentor.service")>();

  return { answerQuestion: vi.fn(actual.answerQuestion) };
});

let api: Awaited<ReturnType<typeof startApi>>;

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

// A reader with one Ready book and a Conversation about it.
const startConversation = async (clerkId = "reader", title = "First") => {
  const user = await createUser(clerkId);

  const [source] = await db
    .insert(sources)
    .values({
      userId: user.id,
      kind: "book",
      title: "Heavy Duty",
      author: "Mike Mentzer",
      pageCount: 120,
      state: "ready",
    })
    .returning();

  const response = await api.as(clerkId).post("/conversations", {
    sourceIds: [source.id],
    firstQuestion: title,
  });

  return response.data.conversationId as string;
};

const newMessage = (
  text = "How many sets should I do?",
): SendMessageRequestBody => ({
  userMessageId: crypto.randomUUID(),
  answerId: crypto.randomUUID(),
  text,
});

// Answers already given in a Conversation, written straight to the database.
const saveAnswers = (
  conversationId: string,
  total: number,
  overrides: Partial<NewMessageRow> = {},
) =>
  db.insert(messages).values(
    Array.from({ length: total }, () => ({
      id: crypto.randomUUID(),
      conversationId,
      role: "mentor" as const,
      status: "complete" as const,
      parts: [],
      citations: [],
      ...overrides,
    })),
  );

const send = (
  conversationId: string,
  message = newMessage(),
  clerkId = "reader",
) => api.as(clerkId).post(`/conversations/${conversationId}/messages`, message);

describe("sending a message", () => {
  it("answers under the id the client chose", async () => {
    const conversationId = await startConversation();
    const message = newMessage();

    const response = await send(conversationId, message);

    expect(response.status).toBe(201);
    expect(response.data.status).toBe("answered");
    expect(response.data.answer).toMatchObject({
      id: message.answerId,
      role: "mentor",
      status: "complete",
    });
    expect(response.data.answer.parts.length).toBeGreaterThan(0);
  });

  it("saves the question and the answer, so they're there after a reload", async () => {
    const conversationId = await startConversation();
    const message = newMessage();

    const sent = await send(conversationId, message);
    const conversation = await api
      .as("reader")
      .get(`/conversations/${conversationId}`);

    expect(conversation.status).toBe(200);
    expect(conversation.data.messages).toEqual([
      { id: message.userMessageId, role: "user", text: message.text },
      sent.data.answer,
    ]);
  });

  it("keeps the messages in the order they were sent", async () => {
    const conversationId = await startConversation();

    await send(conversationId, newMessage("First question"));
    await send(conversationId, newMessage("Second question"));
    const conversation = await api
      .as("reader")
      .get(`/conversations/${conversationId}`);

    const roles = conversation.data.messages.map(
      (message: { role: string }) => message.role,
    );
    const questions = conversation.data.messages
      .filter((message: { role: string }) => message.role === "user")
      .map((message: { text: string }) => message.text);

    expect(roles).toEqual(["user", "mentor", "user", "mentor"]);
    expect(questions).toEqual(["First question", "Second question"]);
  });

  it("moves the Conversation to the top of the list", async () => {
    const older = await startConversation("reader", "Older");
    const newer = await api.as("reader").post("/conversations", {
      sourceIds: [(await db.select().from(sources))[0].id],
      firstQuestion: "Newer",
    });

    const before = await api.as("reader").get("/conversations");
    await send(older);
    const after = await api.as("reader").get("/conversations");

    expect(before.data[0].id).toBe(newer.data.conversationId);
    expect(after.data[0].id).toBe(older);
  });

  it("saves a failed answer as an error, and keeps the question", async () => {
    const conversationId = await startConversation();
    const message = newMessage();
    vi.mocked(answerQuestion).mockRejectedValueOnce(new Error("Model down"));

    const response = await send(conversationId, message);
    const conversation = await api
      .as("reader")
      .get(`/conversations/${conversationId}`);

    const errorAnswer = {
      id: message.answerId,
      role: "mentor",
      status: "error",
      parts: [],
      citations: [],
    };

    expect(response.status).toBe(201);
    expect(response.data.answer).toEqual(errorAnswer);
    expect(conversation.data.messages).toEqual([
      { id: message.userMessageId, role: "user", text: message.text },
      errorAnswer,
    ]);
  });

  it("refuses ids that were already used, and saves nothing new", async () => {
    const conversationId = await startConversation();
    const message = newMessage();

    await send(conversationId, message);
    const retry = await send(conversationId, message);
    const conversation = await api
      .as("reader")
      .get(`/conversations/${conversationId}`);

    expect(retry.status).toBe(409);
    expect(conversation.data.messages).toHaveLength(2);
  });

  it("can't send to another reader's Conversation, and saves nothing", async () => {
    const conversationId = await startConversation("owner");
    await createUser("intruder");

    const response = await send(conversationId, newMessage(), "intruder");
    const saved = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    expect(response.status).toBe(404);
    expect(saved).toHaveLength(0);
  });

  it("can't send to a Conversation that doesn't exist", async () => {
    await createUser("reader");

    const response = await send(crypto.randomUUID());

    expect(response.status).toBe(404);
  });

  it("refuses an empty question", async () => {
    const conversationId = await startConversation();

    const response = await send(conversationId, newMessage(""));

    expect(response.status).toBe(422);
  });

  it("refuses a message over the daily limit, and saves nothing", async () => {
    const conversationId = await startConversation();
    await saveAnswers(conversationId, MESSAGE_LIMIT);

    const response = await send(conversationId);
    const saved = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    expect(response.status).toBe(409);
    expect(response.data).toEqual({ detail: "limit-reached" });
    expect(saved).toHaveLength(MESSAGE_LIMIT);
  });

  it("doesn't count failed answers toward the daily limit", async () => {
    const conversationId = await startConversation();
    await saveAnswers(conversationId, MESSAGE_LIMIT, { status: "error" });

    const response = await send(conversationId);

    expect(response.status).toBe(201);
  });

  it("doesn't count answers older than 24 hours toward the daily limit", async () => {
    const conversationId = await startConversation();
    const dayAndHourAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await saveAnswers(conversationId, MESSAGE_LIMIT, {
      createdAt: dayAndHourAgo,
    });

    const response = await send(conversationId);

    expect(response.status).toBe(201);
  });

  it("gives the messages answered in the last 24 hours, and the limit", async () => {
    const conversationId = await startConversation();
    await saveAnswers(conversationId, 2);
    await saveAnswers(conversationId, 1, { status: "error" });

    const response = await api.as("reader").get("/conversations/message-usage");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ max: MESSAGE_LIMIT, usage: 2 });
  });

  it("refuses message ids that aren't UUIDs", async () => {
    const conversationId = await startConversation();

    const response = await send(conversationId, {
      ...newMessage(),
      userMessageId: "1",
    });

    expect(response.status).toBe(422);
  });
});

describe("a Conversation's messages", () => {
  it("starts empty", async () => {
    const conversationId = await startConversation();

    const conversation = await api
      .as("reader")
      .get(`/conversations/${conversationId}`);

    expect(conversation.data.messages).toEqual([]);
  });
});
