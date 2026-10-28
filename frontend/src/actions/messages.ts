"use server";

import { revalidatePath } from "next/cache";

import { sendMessage } from "@/lib/backend/messages";
import type { NewMessage, SendMessageResult } from "@/lib/backend/types";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";

export const sendMessageAction = async (
  message: NewMessage,
): Promise<SendMessageResult> => {
  const canUse = await canCurrentUserUseSubscriptionPlan("basic");

  if (!canUse || message.text.trim().length === 0) {
    return { status: "failed" };
  }

  const result = await sendMessage({ ...message, text: message.text.trim() });

  // The sidebar orders Conversations by their last activity.
  revalidatePath("/", "layout");

  return result;
};
