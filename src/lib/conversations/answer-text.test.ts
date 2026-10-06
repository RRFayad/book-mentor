import { describe, expect, it } from "vitest";

import type {
  ConversationSource,
  MentorAnswer,
  RichText,
} from "@/lib/backend/types";
import { answerToPlainText } from "@/lib/conversations/answer-text";

const sources: ConversationSource[] = [
  {
    id: "book",
    kind: "book",
    title: "Heavy Duty",
    author: "Mike Mentzer",
    expired: false,
  },
  {
    id: "blog",
    kind: "blog",
    title: "Drew Baye's blog",
    author: "Drew Baye",
    expired: false,
  },
];

const text = (value: string): RichText => [{ type: "text", text: value }];

const answer = (parts: MentorAnswer["parts"]): MentorAnswer => ({
  id: "answer",
  role: "mentor",
  status: "complete",
  parts,
  citations: [],
});

describe("answerToPlainText", () => {
  it("writes each section under its heading, with Citations as [n]", () => {
    expect(
      answerToPlainText(
        answer([
          {
            type: "section",
            section: "source-says",
            content: [
              { type: "text", text: "Train to failure" },
              { type: "citation", number: 1 },
              { type: "text", text: "." },
            ],
          },
          { type: "section", section: "meaning", content: text("Intensity.") },
        ]),
        sources,
      ),
    ).toBe(
      "What the Source says\nTrain to failure [1].\n\nWhat it means\nIntensity.",
    );
  });

  it("names each Source in a comparison", () => {
    expect(
      answerToPlainText(
        answer([
          {
            type: "positions",
            positions: [
              { sourceId: "book", content: text("One set.") },
              { sourceId: "blog", content: text("Brief workouts.") },
            ],
          },
          {
            type: "not-addressed",
            sourceId: "blog",
            content: text("Silence."),
          },
        ]),
        sources,
      ),
    ).toBe(
      "Each Source's position\nHeavy Duty: One set.\nDrew Baye's blog: Brief workouts.\n\nNot addressed by Drew Baye's blog\nSilence.",
    );
  });

  it("writes plain Mentor text and the not-covered line", () => {
    expect(
      answerToPlainText(
        answer([{ type: "text", content: text("It expired.") }]),
        sources,
      ),
    ).toBe("It expired.");
    expect(answerToPlainText(answer([{ type: "not-covered" }]), sources)).toBe(
      "I couldn't find anything about this in your Sources.",
    );
  });
});
