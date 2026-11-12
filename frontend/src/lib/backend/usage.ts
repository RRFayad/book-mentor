import "server-only";

import { MESSAGE_LIMIT, SOURCE_LIMIT } from "@app/shared/constants";
import type { MessageUsageResponse } from "@app/shared/schemas";

import { callBackend } from "@/lib/backend/call-backend";
import { listSources } from "@/lib/backend/sources";
import type { Usage } from "@/lib/backend/types";

export const getUsage = async (): Promise<Usage> => {
  const messageUsage = await callBackend<MessageUsageResponse>(
    "get message usage",
    { max: MESSAGE_LIMIT, usage: 0 },
    async (backend) => {
      const { data } = await backend.get<MessageUsageResponse>(
        "/conversations/message-usage",
      );

      return data;
    },
  );

  const sources = await listSources();

  return {
    activeSources: sources.length,
    sourceLimit: SOURCE_LIMIT,
    messagesInWindow: messageUsage.usage,
    messageLimit: messageUsage.max,
    nextMessageAvailableAt: null,
  };
};
