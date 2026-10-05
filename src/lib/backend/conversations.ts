import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type { Conversation, ConversationSummary } from "@/lib/backend/types";

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
