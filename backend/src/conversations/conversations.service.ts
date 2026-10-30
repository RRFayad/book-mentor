import { CreateConversationRequestBody } from "@app/shared/schemas";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  conversations,
  conversationSources,
  sources,
} from "@app/shared/db/schema";
import { HttpError } from "../errors";

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

export const getConversationByUserId = async (
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

  return { ...conversation, sources: conversationSourcesWithExpiry };
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
