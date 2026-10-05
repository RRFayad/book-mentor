"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createConversation,
  deleteConversation,
  renameConversation,
} from "@/lib/backend/conversations";
import { canStartConversation } from "@/lib/conversations/source-picks";
import { routes } from "@/lib/routes";

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

export const renameConversationAction = async (
  conversationId: string,
  title: string,
): Promise<{ ok: boolean }> => {
  const { userId } = await auth();
  const ok =
    Boolean(userId) && (await renameConversation(conversationId, title));

  if (ok) {
    // The sidebar and the header show the title.
    revalidatePath("/", "layout");
  }

  return { ok };
};

// When the user is viewing the deleted Conversation, go to New Conversation
// from the server, so its page never re-renders as "not found".
export const deleteConversationAction = async (
  conversationId: string,
  isViewing: boolean,
): Promise<{ ok: boolean }> => {
  const { userId } = await auth();
  const ok = Boolean(userId) && (await deleteConversation(conversationId));

  if (ok && isViewing) {
    redirect(routes.conversations.new);
  }

  if (ok) {
    revalidatePath("/", "layout");
  }

  return { ok };
};
