import type { AddressInfo } from "node:net";

import { users } from "@app/shared/db/schema";
import axios from "axios";

import { createApp } from "../create-app";
import { db } from "../db";

// Starts the real API on a free port. Tests call it over HTTP with axios, the
// same client the frontend uses, so headers and bodies behave like production.
export const startApi = async () => {
  const app = await createApp({ logger: false });

  await app.listen({ port: 0, host: "127.0.0.1" });

  const { port } = app.server.address() as AddressInfo;
  const baseURL = `http://127.0.0.1:${port}`;

  // A client signed in as `clerkId` (or signed out). Every status resolves,
  // so tests assert on it directly.
  const as = (clerkId?: string) =>
    axios.create({
      baseURL,
      headers: clerkId ? { "x-test-user": clerkId } : {},
      validateStatus: () => true,
    });

  return { as, close: () => app.close() };
};

// The users row the Clerk webhook would have created on sign-up.
export const createUser = async (clerkId: string) => {
  const [user] = await db
    .insert(users)
    .values({ clerkId, email: `${clerkId}@example.com` })
    .returning();

  return user;
};
