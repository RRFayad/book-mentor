import { describe, expect, it } from "vitest";

import type { Source } from "@/lib/backend/types";
import {
  canStartConversation,
  titleFromQuestion,
  toggleSourcePick,
} from "@/lib/conversations/source-picks";

const source = (id: string, state: "ready" | "ingesting" = "ready"): Source =>
  ({
    id,
    kind: "book",
    title: id,
    author: "Author",
    pageCount: 100,
    addedAt: "2026-10-01T00:00:00Z",
    expiresAt: "2026-10-08T00:00:00Z",
    ...(state === "ready"
      ? { state: "ready" }
      : { state: "ingesting", ingestionProgress: 10 }),
  }) as Source;

describe("toggleSourcePick", () => {
  it("adds a Ready Source and removes it when picked again", () => {
    const picked = toggleSourcePick([], source("a"));

    expect(picked).toEqual(["a"]);
    expect(toggleSourcePick(picked, source("a"))).toEqual([]);
  });

  it("ignores a Source that is still Ingesting", () => {
    expect(toggleSourcePick([], source("a", "ingesting"))).toEqual([]);
  });

  it("allows at most 3 Sources", () => {
    expect(toggleSourcePick(["a", "b", "c"], source("d"))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("canStartConversation", () => {
  it("needs 1 to 3 Sources and a question", () => {
    expect(canStartConversation(["a"], "Why?")).toBe(true);
    expect(canStartConversation(["a", "b", "c"], "Why?")).toBe(true);
    expect(canStartConversation([], "Why?")).toBe(false);
    expect(canStartConversation(["a"], "   ")).toBe(false);
  });
});

describe("titleFromQuestion", () => {
  it("uses the question, with spaces tidied", () => {
    expect(titleFromQuestion("  What does   Mentzer mean?  ")).toBe(
      "What does Mentzer mean?",
    );
  });

  it("cuts a long question at a word, before 60 characters, with an ellipsis", () => {
    const title = titleFromQuestion(
      "Where does Mentzer's view on training volume conflict with Drew Baye's view on it?",
    );

    expect(title).toBe(
      "Where does Mentzer's view on training volume conflict with…",
    );
    expect(title.length).toBeLessThanOrEqual(60);
  });
});
