import "server-only";

import { SOURCE_LIMIT } from "@app/shared/constants";

import { getMockStore } from "@/lib/backend/mock/store";
import { listSources } from "@/lib/backend/sources";
import type { Usage } from "@/lib/backend/types";
import { messageAllowance } from "@/lib/usage/message-allowance";

export const MESSAGE_LIMIT = 50;

// Active Sources come from the API; the message limit is still mocked (#25).
export const getUsage = async (): Promise<Usage> => {
  const sources = await listSources();
  const { sentMessages } = getMockStore();
  const allowance = messageAllowance(sentMessages, new Date(), MESSAGE_LIMIT);

  return {
    activeSources: sources.length,
    sourceLimit: SOURCE_LIMIT,
    messagesInWindow: allowance.used,
    messageLimit: MESSAGE_LIMIT,
    nextMessageAvailableAt: allowance.nextAvailableAt,
  };
};
