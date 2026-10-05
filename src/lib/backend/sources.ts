import "server-only";

import { SOURCE_LIFETIME } from "@/lib/backend/mock/data";
import { getMockStore } from "@/lib/backend/mock/store";
import type { AddSourceResult, NewSource, Source } from "@/lib/backend/types";
import { SOURCE_LIMIT } from "@/lib/backend/usage";

// The PDF is not read yet, so the mock gives every new book this page count.
const MOCK_PAGE_COUNT = 240;
const MOCK_POST_COUNT = 20;

export const listSources = async (): Promise<Source[]> =>
  getMockStore().sources.map((source) => ({ ...source }));

// Mock results for demos: a file name or blog address containing "scanned",
// "large" or "fail" gives that result. Anything else is added as Ingesting.
export const addSource = async (input: NewSource): Promise<AddSourceResult> => {
  const store = getMockStore();

  if (store.sources.length >= SOURCE_LIMIT) {
    return { status: "limit-reached" };
  }

  const trigger = (
    input.kind === "book" ? input.fileName : input.address
  ).toLowerCase();

  if (trigger.includes("scanned")) {
    return { status: "rejected", reason: "scanned" };
  }

  if (trigger.includes("large")) {
    return { status: "rejected", reason: "too-large" };
  }

  if (trigger.includes("fail")) {
    return { status: "failed" };
  }

  const now = Date.now();
  const details =
    input.kind === "book"
      ? { kind: "book" as const, pageCount: MOCK_PAGE_COUNT }
      : {
          kind: "blog" as const,
          postCount: MOCK_POST_COUNT,
          address: input.address.trim(),
        };
  const source: Source = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    author: input.author.trim(),
    addedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SOURCE_LIFETIME).toISOString(),
    state: "ingesting",
    ingestionProgress: 0,
    ...details,
  };

  store.sources.push(source);

  return { status: "added", source: { ...source } };
};
