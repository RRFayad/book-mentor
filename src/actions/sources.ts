"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { addSource } from "@/lib/backend/sources";
import type { AddSourceResult, NewSource } from "@/lib/backend/types";
import { isNewSourceValid } from "@/lib/sources/new-source";

// Results are returned, not thrown, so the dialog can show them.
export const addSourceAction = async (
  input: NewSource,
): Promise<AddSourceResult> => {
  const { userId } = await auth();

  if (!userId || !isNewSourceValid(input)) {
    return { status: "failed" };
  }

  const result = await addSource(input);

  if (result.status === "added") {
    // The Library and the sidebar's Source count both change.
    revalidatePath("/", "layout");
  }

  return result;
};
