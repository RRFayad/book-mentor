"use server";

import { auth } from "@clerk/nextjs/server";

import { getHealthStatus } from "@/lib/backend/system";

type BackendHealthResult =
  { ok: true; status: string } | { ok: false; error: string };

// Expected failures are returned, not thrown, so the caller can show a toast.
export const checkBackendHealth = async (): Promise<BackendHealthResult> => {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, error: "Sign in to check the backend." };
  }

  try {
    const { status } = await getHealthStatus();

    return { ok: true, status };
  } catch {
    return {
      ok: false,
      error: "FastAPI didn't respond. Check that the backend is running.",
    };
  }
};
