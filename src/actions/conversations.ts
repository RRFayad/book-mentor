"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createConversation } from "@/lib/backend/conversations";
import { canStartConversation } from "@/lib/conversations/source-picks";

export const createConversationAction = async (
  sourceIds: string[],
  firstQuestion: string,
): Promise<{ conversationId: string } | null> => {
  const { userId } = await auth();

  if (!userId || !canStartConversation(sourceIds, firstQuestion)) {
    return null;
  }

  const result = await createConversation(sourceIds, firstQuestion.trim());

  if (result) {
    // The new Conversation appears in the sidebar.
    revalidatePath("/", "layout");
  }

  return result;
};
