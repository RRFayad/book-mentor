import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type { ConversationSummary } from "@/lib/backend/types";

export const listConversations = async (): Promise<ConversationSummary[]> =>
  getMockStore().conversations.map(({ id, title, lastActivityAt }) => ({
    id,
    title,
    lastActivityAt,
  }));
