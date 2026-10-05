import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type { Usage } from "@/lib/backend/types";

const SOURCE_LIMIT = 3;
const MESSAGE_LIMIT = 50;
const MESSAGE_WINDOW_MS = 24 * 60 * 60 * 1000;

// Message counting stays simple until the rolling-limit rule is built; it does
// not compute nextMessageAvailableAt yet.
export const getUsage = async (): Promise<Usage> => {
  const { sources, sentMessages } = getMockStore();
  const windowStart = Date.now() - MESSAGE_WINDOW_MS;

  return {
    activeSources: sources.length,
    sourceLimit: SOURCE_LIMIT,
    messagesInWindow: sentMessages.filter(
      (message) =>
        !message.answerFailed && Date.parse(message.sentAt) > windowStart,
    ).length,
    messageLimit: MESSAGE_LIMIT,
    nextMessageAvailableAt: null,
  };
};
