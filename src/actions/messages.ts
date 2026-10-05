"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { sendMessage, stopAnswer } from "@/lib/backend/messages";
import type {
  MentorAnswer,
  NewMessage,
  SendMessageResult,
} from "@/lib/backend/types";

export const sendMessageAction = async (
  message: NewMessage,
): Promise<SendMessageResult> => {
  const { userId } = await auth();

  if (!userId || message.text.trim().length === 0) {
    return { status: "failed" };
  }

  const result = await sendMessage({ ...message, text: message.text.trim() });

  // The sidebar orders Conversations by their last activity.
  revalidatePath("/", "layout");

  return result;
};

export const stopAnswerAction = async (
  conversationId: string,
  shownAnswer: MentorAnswer,
): Promise<void> => {
  const { userId } = await auth();

  if (userId) {
    await stopAnswer(conversationId, shownAnswer);
  }
};
