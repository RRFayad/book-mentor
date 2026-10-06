"use server";

import { revalidatePath } from "next/cache";

import { addSource, deleteSource } from "@/lib/backend/sources";
import type { AddSourceResult, NewSource } from "@/lib/backend/types";
import { isNewSourceValid } from "@/lib/sources/new-source";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";

// Results are returned, not thrown, so the dialog can show them.
export const addSourceAction = async (
  input: NewSource,
): Promise<AddSourceResult> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );

  if (!canUse || !isNewSourceValid(input)) {
    return { status: "failed" };
  }

  const result = await addSource(input);

  if (result.status === "added") {
    // The Library and the sidebar's Source count both change.
    revalidatePath("/", "layout");
  }

  return result;
};

export const deleteSourceAction = async (
  sourceId: string,
): Promise<{ ok: boolean }> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );

  if (!canUse) {
    return { ok: false };
  }

  const ok = await deleteSource(sourceId);

  if (ok) {
    revalidatePath("/", "layout");
  }

  return { ok };
};
