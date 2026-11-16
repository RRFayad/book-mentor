import { describe, expect, it } from "vitest";

import { isIngestionInterrupted } from "@/lib/sources/interrupted-ingestion";

const MINUTE = 60 * 1000;
const NOW = new Date("2026-10-15T12:00:00Z");

const addedAgo = (minutes: number): Date =>
  new Date(NOW.getTime() - minutes * MINUTE);

describe("isIngestionInterrupted", () => {
  it("is true for a book still Ingesting after 15 minutes", () => {
    const source = { state: "ingesting" as const, createdAt: addedAgo(16) };

    expect(isIngestionInterrupted(source, NOW)).toBe(true);
  });

  it("is false while a book may still be sending", () => {
    const source = { state: "ingesting" as const, createdAt: addedAgo(14) };

    expect(isIngestionInterrupted(source, NOW)).toBe(false);
  });

  it("is false for a Ready book, however old", () => {
    const source = { state: "ready" as const, createdAt: addedAgo(60) };

    expect(isIngestionInterrupted(source, NOW)).toBe(false);
  });
});
