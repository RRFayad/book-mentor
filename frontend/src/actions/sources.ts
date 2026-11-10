"use server";

import { revalidatePath } from "next/cache";

import {
  completeSource,
  createSource,
  deleteSource,
  sendPageBatch,
} from "@/lib/backend/sources";
import type {
  AddSourceResult,
  NewSource,
  PageBatch,
} from "@/lib/backend/types";
import { isNewSourceValid } from "@/lib/sources/new-source";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";

// Results are returned, not thrown, so the dialog can show them.
export const addSourceAction = async (
  input: NewSource,
): Promise<AddSourceResult> => {
  const canUse = await canCurrentUserUseSubscriptionPlan("basic");

  if (!canUse || !isNewSourceValid(input)) {
    return { status: "failed" };
  }

  const result = await createSource(input);

  if (result.status === "added") {
    // The Library and the sidebar's Source count both change.
    revalidatePath("/", "layout");
  }

  return result;
};

export const deleteSourceAction = async (
  sourceId: string,
): Promise<{ ok: boolean }> => {
  const canUse = await canCurrentUserUseSubscriptionPlan("basic");

  if (!canUse) {
    return { ok: false };
  }

  const ok = await deleteSource(sourceId);

  if (ok) {
    revalidatePath("/", "layout");
  }

  return { ok };
};

// Next.js runs a browser's Server Actions one at a time, so batches meant to
// go together are sent in one action, and from here to the API in parallel.
export const sendPageBatchesAction = async (
  sourceId: string,
  batches: PageBatch[],
): Promise<{ ok: boolean }> => {
  const canUse = await canCurrentUserUseSubscriptionPlan("basic");

  if (!canUse) {
    return { ok: false };
  }

  const sends = batches.map((batch) => sendPageBatch(sourceId, batch));
  const results = await Promise.all(sends);

  return { ok: results.every(Boolean) };
};

export const completeSourceAction = async (
  sourceId: string,
): Promise<{ ok: boolean }> => {
  const canUse = await canCurrentUserUseSubscriptionPlan("basic");
  const ok = canUse && (await completeSource(sourceId));

  if (ok) {
    // The Source shows as Ready in the Library and the New Conversation picker.
    revalidatePath("/", "layout");
  }

  return { ok };
};
