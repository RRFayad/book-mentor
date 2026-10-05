"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createConversation,
  deleteConversation,
  renameConversation,
} from "@/lib/backend/conversations";
import { getUsage } from "@/lib/backend/usage";
import { canStartConversation } from "@/lib/conversations/source-picks";
import { routes } from "@/lib/routes";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";

export type CreateConversationResult =
  | { status: "created"; conversationId: string }
  | { status: "limit-reached" }
  | { status: "failed" };

// A Conversation starts by sending its first question, so it is not created
// when no message is left in the 24-hour window.
export const createConversationAction = async (
  sourceIds: string[],
  firstQuestion: string,
): Promise<CreateConversationResult> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );

  if (!canUse || !canStartConversation(sourceIds, firstQuestion)) {
    return { status: "failed" };
  }

  const usage = await getUsage();

  if (usage.messagesInWindow >= usage.messageLimit) {
    return { status: "limit-reached" };
  }

  const result = await createConversation(sourceIds, firstQuestion.trim());

  if (!result) {
    return { status: "failed" };
  }

  // The new Conversation appears in the sidebar.
  revalidatePath("/", "layout");

  return { status: "created", conversationId: result.conversationId };
};

export const renameConversationAction = async (
  conversationId: string,
  title: string,
): Promise<{ ok: boolean }> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );
  const ok = canUse && (await renameConversation(conversationId, title));

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
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );
  const ok = canUse && (await deleteConversation(conversationId));

  if (ok) {
    revalidatePath("/", "layout");
  }

  if (ok && isViewing) {
    redirect(routes.conversations.new);
  }

  return { ok };
};
