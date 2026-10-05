"use server";

import { revalidatePath } from "next/cache";

import { sendMessage, stopAnswer } from "@/lib/backend/messages";
import type { NewMessage, SendMessageResult } from "@/lib/backend/types";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";

export const sendMessageAction = async (
  message: NewMessage,
): Promise<SendMessageResult> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );

  if (!canUse || message.text.trim().length === 0) {
    return { status: "failed" };
  }

  const result = await sendMessage({ ...message, text: message.text.trim() });

  // The sidebar orders Conversations by their last activity.
  revalidatePath("/", "layout");

  return result;
};

export const stopAnswerAction = async (
  conversationId: string,
  answerId: string,
  shownWords: number,
): Promise<void> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );

  if (canUse) {
    await stopAnswer(conversationId, answerId, shownWords);
  }
};
