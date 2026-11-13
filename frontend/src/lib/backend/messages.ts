import "server-only";

import axios from "axios";
import { unstable_rethrow } from "next/navigation";

import { getAuthenticatedBackendClient } from "@/lib/backend/client";
import type { NewMessage, SendMessageResult } from "@/lib/backend/types";
import { getUsage } from "@/lib/backend/usage";

// POST /conversations/{id}/messages (docs/api-contract.md).
// Until streaming (#20), the whole answer comes back at once.
export const sendMessage = async ({
  conversationId,
  ...message
}: NewMessage): Promise<SendMessageResult> => {
  try {
    const backend = await getAuthenticatedBackendClient();
    const { data } = await backend.post<SendMessageResult>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      message,
    );

    return data;
  } catch (error) {
    unstable_rethrow(error);

    const detail = axios.isAxiosError(error) && error.response?.data?.detail;

    if (detail === "limit-reached") {
      const usage = await getUsage();

      return { status: "limit-reached", usage };
    }

    console.error("Failed to send a message", error);

    return { status: "failed" };
  }
};
