import { describe, expect, it } from "vitest";

import type { Source } from "@/lib/backend/types";
import {
  canStartConversation,
  titleFromQuestion,
  toggleSourcePick,
} from "@/lib/conversations/source-picks";

const source = (
  id: string,
  state: "ready" | "ingesting" = "ready",
): Source => ({
  id,
  kind: "book",
  title: id,
  author: "Author",
  pageCount: 100,
  postCount: null,
  address: null,
  state,
  ingestionProgress: state === "ready" ? 100 : 10,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  expiresAt: new Date("2026-10-08T00:00:00Z"),
});

describe("toggleSourcePick", () => {
  it("adds a Ready Source and removes it when picked again", () => {
    const picked = toggleSourcePick([], source("a"));

    expect(picked).toEqual(["a"]);
    expect(toggleSourcePick(picked, source("a"))).toEqual([]);
  });

  it("ignores a Source that is still Ingesting", () => {
    expect(toggleSourcePick([], source("a", "ingesting"))).toEqual([]);
  });

  it("allows only 1 Source", () => {
    expect(toggleSourcePick(["a"], source("b"))).toEqual(["a"]);
  });
});

describe("canStartConversation", () => {
  it("needs 1 Source and a question", () => {
    expect(canStartConversation(["a"], "Why?")).toBe(true);
    expect(canStartConversation(["a", "b"], "Why?")).toBe(false);
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
