import "server-only";

import axios, { type AxiosInstance } from "axios";
import { unstable_rethrow } from "next/navigation";

import { getAuthenticatedBackendClient } from "@/lib/backend/client";

// Runs one API call and returns `fallback` if it fails. A 404 is expected while
// a route isn't built yet (or the item doesn't exist), so it isn't logged.
export const callBackend = async <T>(
  description: string,
  fallback: T,
  call: (backend: AxiosInstance) => Promise<T>,
): Promise<T> => {
  try {
    const backend = await getAuthenticatedBackendClient();

    return await call(backend);
  } catch (error) {
    // Next.js signals (dynamic rendering, redirect, notFound) are errors too.
    unstable_rethrow(error);

    const notFound =
      axios.isAxiosError(error) && error.response?.status === 404;

    if (!notFound) {
      console.error(`Failed to ${description}`, error);
    }

    return fallback;
  }
};
