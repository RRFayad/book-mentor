import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type { Conversation, ConversationSummary } from "@/lib/backend/types";
import {
  SOURCE_PICK_LIMIT,
  titleFromQuestion,
} from "@/lib/conversations/source-picks";

export const listConversations = async (): Promise<ConversationSummary[]> =>
  getMockStore().conversations.map(({ id, title, lastActivityAt }) => ({
    id,
    title,
    lastActivityAt,
  }));

export const getConversation = async (
  conversationId: string,
): Promise<Conversation | null> => {
  const conversation = getMockStore().conversations.find(
    (item) => item.id === conversationId,
  );

  return conversation ? structuredClone(conversation) : null;
};

// Creates an empty Conversation from 1 to 3 Ready Sources. The thread then
// sends the first question, so its answer streams like any other.
export const createConversation = async (
  sourceIds: string[],
  firstQuestion: string,
): Promise<{ conversationId: string } | null> => {
  const store = getMockStore();
  const sources = [...new Set(sourceIds)].map((id) =>
    store.sources.find((source) => source.id === id),
  );

  if (
    sources.length < 1 ||
    sources.length > SOURCE_PICK_LIMIT ||
    sources.some((source) => source?.state !== "ready")
  ) {
    return null;
  }

  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: titleFromQuestion(firstQuestion),
    lastActivityAt: new Date().toISOString(),
    sources: sources.flatMap((source) =>
      source
        ? [
            {
              id: source.id,
              kind: source.kind,
              title: source.title,
              author: source.author,
              expired: false,
            },
          ]
        : [],
    ),
    messages: [],
  };

  store.conversations.unshift(conversation);

  return { conversationId: conversation.id };
};

export const renameConversation = async (
  conversationId: string,
  title: string,
): Promise<boolean> => {
  const conversation = getMockStore().conversations.find(
    (item) => item.id === conversationId,
  );
  const tidy = title.trim().replace(/\s+/g, " ");

  if (!conversation || tidy.length === 0) {
    return false;
  }

  conversation.title = tidy;

  return true;
};

export const deleteConversation = async (
  conversationId: string,
): Promise<boolean> => {
  const { conversations } = getMockStore();
  const index = conversations.findIndex((item) => item.id === conversationId);

  if (index === -1) {
    return false;
  }

  conversations.splice(index, 1);

  return true;
};
