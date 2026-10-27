import "server-only";

import { callBackend } from "@/lib/backend/call-backend";
import type {
  Conversation,
  ConversationSummary,
  CreateConversationResult,
} from "@/lib/backend/types";

// The Conversation routes arrive in #19 (docs/api-contract.md). Until then the
// API answers 404, so these return their empty result.

export const listConversations = async (): Promise<ConversationSummary[]> =>
  callBackend("list Conversations", [], async (backend) => {
    const { data } = await backend.get<ConversationSummary[]>("/conversations");

    return data;
  });

export const getConversation = async (
  conversationId: string,
): Promise<Conversation | null> =>
  callBackend("get a Conversation", null, async (backend) => {
    const { data } = await backend.get<Conversation>(
      `/conversations/${encodeURIComponent(conversationId)}`,
    );

    return data;
  });

// Creates an empty Conversation from 1 to 3 Ready Sources. The thread then
// sends the first question, so its answer arrives like any other.
export const createConversation = async (
  sourceIds: string[],
  firstQuestion: string,
): Promise<CreateConversationResult> =>
  callBackend(
    "create a Conversation",
    { status: "failed" },
    async (backend) => {
      const { data } = await backend.post<CreateConversationResult>(
        "/conversations",
        { sourceIds, firstQuestion },
      );

      return data;
    },
  );

export const renameConversation = async (
  conversationId: string,
  title: string,
): Promise<boolean> =>
  callBackend("rename a Conversation", false, async (backend) => {
    await backend.patch(
      `/conversations/${encodeURIComponent(conversationId)}`,
      {
        title,
      },
    );

    return true;
  });

export const deleteConversation = async (
  conversationId: string,
): Promise<boolean> =>
  callBackend("delete a Conversation", false, async (backend) => {
    await backend.delete(
      `/conversations/${encodeURIComponent(conversationId)}`,
    );

    return true;
  });
