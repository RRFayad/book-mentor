import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type { Usage } from "@/lib/backend/types";
import { messageAllowance } from "@/lib/usage/message-allowance";

export const SOURCE_LIMIT = 3;
export const MESSAGE_LIMIT = 50;

export const getUsage = async (): Promise<Usage> => {
  const { sources, sentMessages } = getMockStore();
  const allowance = messageAllowance(sentMessages, new Date(), MESSAGE_LIMIT);

  return {
    activeSources: sources.length,
    sourceLimit: SOURCE_LIMIT,
    messagesInWindow: allowance.used,
    messageLimit: MESSAGE_LIMIT,
    nextMessageAvailableAt: allowance.nextAvailableAt,
  };
};
