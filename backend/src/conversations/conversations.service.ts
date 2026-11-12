import {
  CreateConversationRequestBody,
  MentorAnswer,
  Message,
  SendMessageRequestBody,
} from "@app/shared/schemas";
import { MESSAGE_LIMIT } from "@app/shared/constants";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { db } from "../db";
import {
  conversations,
  conversationSources,
  MessageRow,
  messages,
  SourceRow,
  sources,
} from "@app/shared/db/schema";
import { traceable } from "langsmith/traceable";
import { HttpError } from "../errors";
import { answerQuestion } from "../mentor/mentor.service";

export const createConversation = async (
  data: CreateConversationRequestBody,
  userId: number,
) => {
  const { firstQuestion, sourceIds } = data;
  //TODO: Add logic for renaming the conversation
  const title = firstQuestion;

  const dbActiveSources = await db
    .select()
    .from(sources)
    .where(
      and(
        inArray(sources.id, sourceIds),
        gt(sources.expiresAt, new Date()),
        eq(sources.state, "ready"),
        eq(sources.userId, userId),
      ),
    );

  if (dbActiveSources.length !== sourceIds.length) {
    throw new HttpError(404, "Source not found, not ready or expired");
  }

  const createdConversationId = await db.transaction(async (tx) => {
    const [newConversation] = await tx
      .insert(conversations)
      .values({ userId, title })
      .returning();

    const formattedConversationSources = dbActiveSources.map((source) => ({
      conversationId: newConversation.id,
      sourceId: source.id,
    }));

    await tx.insert(conversationSources).values(formattedConversationSources);

    return newConversation.id;
  });

  return createdConversationId;
};

export const getConversationsByUserId = async (userId: number) => {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.lastActivityAt));
};

const findConversationByUserId = async (
  conversationId: string,
  userId: number,
) => {
  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId),
    ),
  });

  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  return conversation;
};

const toMessage = (row: MessageRow): Message => {
  if (row.role === "user") {
    return { id: row.id, role: "user", text: row.text ?? "" };
  }

  return {
    id: row.id,
    role: "mentor",
    status: row.status ?? "error",
    parts: row.parts ?? [],
    citations: row.citations ?? [],
  };
};

export const getConversationByUserId = async (
  conversationId: string,
  userId: number,
) => {
  const conversation = await findConversationByUserId(conversationId, userId);

  const linkedSources = await db
    .select({
      id: sources.id,
      kind: sources.kind,
      title: sources.title,
      author: sources.author,
      expiresAt: sources.expiresAt,
    })
    .from(conversationSources)
    .innerJoin(sources, eq(conversationSources.sourceId, sources.id))
    .where(eq(conversationSources.conversationId, conversationId));

  const now = new Date();

  const conversationSourcesWithExpiry = linkedSources.map(
    ({ expiresAt, ...source }) => ({ ...source, expired: expiresAt <= now }),
  );

  const messageRows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const conversationMessages = messageRows.map(toMessage);

  return {
    ...conversation,
    sources: conversationSourcesWithExpiry,
    messages: conversationMessages,
  };
};

export const renameConversationByUserId = async (
  conversationId: string,
  userId: number,
  title: string,
) => {
  const [conversation] = await db
    .update(conversations)
    .set({ title })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .returning();

  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  return conversation;
};

export const deleteConversationByUserId = async (
  conversationId: string,
  userId: number,
) => {
  const deleted = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId),
      ),
    )
    .returning({ id: conversations.id });

  if (deleted.length === 0) {
    throw new HttpError(404, "Conversation not found");
  }
};

const getConversationSources = async (conversationId: string) => {
  return db
    .select(getTableColumns(sources))
    .from(conversationSources)
    .innerJoin(sources, eq(conversationSources.sourceId, sources.id))
    .where(eq(conversationSources.conversationId, conversationId));
};

// The last 3 questions and answers, so the Mentor understands follow-ups.
const RECENT_MESSAGE_COUNT = 6;

// Failed answers are left out: they hold no text.
const getRecentMessages = async (conversationId: string) => {
  const newestFirst = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        or(isNull(messages.status), ne(messages.status, "error")),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(RECENT_MESSAGE_COUNT);

  return newestFirst.toReversed();
};

const getMentorReply = async (
  conversationId: string,
  question: string,
  selectedSources: SourceRow[],
  recentMessages: MessageRow[],
) => {
  // LangSmith groups traces with the same conversation_id into one Thread.
  const tracedAnswerQuestion = traceable(answerQuestion, {
    name: "Mentor answer",
    metadata: { conversation_id: conversationId },
  });

  try {
    const reply = await tracedAnswerQuestion(
      question,
      selectedSources,
      recentMessages,
    );

    return { status: "complete" as const, ...reply };
  } catch (error) {
    console.error("The Mentor couldn't answer", error);

    return { status: "error" as const, parts: [], citations: [] };
  }
};

const countAnswersInLastDayByUserId = async (userId: number) => {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [result] = await db
    .select({ total: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(
      and(
        eq(conversations.userId, userId),
        eq(messages.role, "mentor"),
        ne(messages.status, "error"),
        gt(messages.createdAt, dayAgo),
      ),
    );

  return result.total;
};

export const getMessageUsageByUserId = async (userId: number) => {
  const usage = await countAnswersInLastDayByUserId(userId);

  return { max: MESSAGE_LIMIT, usage };
};

// No transaction: the answer takes seconds, and the question is kept even if it fails
export const sendMessage = async (
  conversationId: string,
  message: SendMessageRequestBody,
  userId: number,
): Promise<MentorAnswer> => {
  await findConversationByUserId(conversationId, userId);

  const answersInLastDay = await countAnswersInLastDayByUserId(userId);

  if (answersInLastDay >= MESSAGE_LIMIT) {
    throw new HttpError(409, "limit-reached");
  }

  const selectedSources = await getConversationSources(conversationId);
  const recentMessages = await getRecentMessages(conversationId);

  const [question] = await db
    .insert(messages)
    .values({
      id: message.userMessageId,
      conversationId,
      role: "user",
      text: message.text,
    })
    .onConflictDoNothing()
    .returning({ id: messages.id });

  if (!question) {
    throw new HttpError(409, "Message already sent");
  }

  const reply = await getMentorReply(
    conversationId,
    message.text,
    selectedSources,
    recentMessages,
  );
  const answer: MentorAnswer = {
    id: message.answerId,
    role: "mentor",
    ...reply,
  };

  await db.insert(messages).values({ ...answer, conversationId });

  await db
    .update(conversations)
    .set({ lastActivityAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return answer;
};
