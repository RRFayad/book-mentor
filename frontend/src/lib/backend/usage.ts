import "server-only";

import { MESSAGE_LIMIT, SOURCE_LIMIT } from "@app/shared/constants";

import { callBackend } from "@/lib/backend/call-backend";
import { listSources } from "@/lib/backend/sources";
import type { Usage } from "@/lib/backend/types";

// GET /usage (docs/api-contract.md) arrives in #25. Until then: the real
// number of active Sources, and no messages counted yet.
export const getUsage = async (): Promise<Usage> => {
  const usage = await callBackend<Usage | null>(
    "get usage",
    null,
    async (backend) => {
      const { data } = await backend.get<Usage>("/usage");

      return data;
    },
  );

  if (usage) {
    return usage;
  }

  const sources = await listSources();

  return {
    activeSources: sources.length,
    sourceLimit: SOURCE_LIMIT,
    messagesInWindow: 0,
    messageLimit: MESSAGE_LIMIT,
    nextMessageAvailableAt: null,
  };
};
