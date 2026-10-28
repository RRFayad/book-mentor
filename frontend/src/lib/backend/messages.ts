import "server-only";

import { callBackend } from "@/lib/backend/call-backend";
import type { NewMessage, SendMessageResult } from "@/lib/backend/types";

// POST /conversations/{id}/messages (docs/api-contract.md), arriving in #19.
// Until streaming (#20), the whole answer comes back at once.
export const sendMessage = async ({
  conversationId,
  ...message
}: NewMessage): Promise<SendMessageResult> =>
  callBackend("send a message", { status: "failed" }, async (backend) => {
    const { data } = await backend.post<SendMessageResult>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      message,
    );

    return data;
  });
