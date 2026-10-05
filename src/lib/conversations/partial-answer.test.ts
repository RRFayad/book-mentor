import { describe, expect, it } from "vitest";

import type { Citation, MentorAnswer } from "@/lib/backend/types";
import {
  answerWordCount,
  partialAnswer,
} from "@/lib/conversations/partial-answer";

const citation = (number: number): Citation => ({
  number,
  sourceId: "book",
  sourceTitle: "Heavy Duty",
  author: "Mike Mentzer",
  location: { kind: "page", page: number },
  quotedText: `[Passage ${number}]`,
});

const answer: MentorAnswer = {
  id: "answer",
  role: "mentor",
  status: "complete",
  parts: [
    {
      type: "section",
      section: "source-says",
      content: [
        { type: "text", text: "One two three" },
        { type: "citation", number: 1 },
        { type: "text", text: " four five." },
      ],
    },
    {
      type: "section",
      section: "meaning",
      content: [{ type: "text", text: "Six seven" }],
    },
  ],
  citations: [citation(1)],
};

describe("partialAnswer", () => {
  it("counts the words of the whole answer", () => {
    expect(answerWordCount(answer)).toBe(7);
  });

  it("keeps the first words and leaves out later parts", () => {
    expect(partialAnswer(answer, 2)).toEqual({
      ...answer,
      status: "streaming",
      parts: [
        {
          type: "section",
          section: "source-says",
          content: [{ type: "text", text: "One two" }],
        },
      ],
      citations: [],
    });
  });

  it("keeps a Citation marker and its Citation once the words before it are shown", () => {
    const partial = partialAnswer(answer, 4);

    expect(partial.parts[0]).toEqual({
      type: "section",
      section: "source-says",
      content: [
        { type: "text", text: "One two three" },
        { type: "citation", number: 1 },
        { type: "text", text: " four" },
      ],
    });
    expect(partial.citations).toEqual([citation(1)]);
  });

  it("returns the whole answer once every word is shown", () => {
    expect(partialAnswer(answer, 7).parts).toEqual(answer.parts);
  });

  it("shows a not-covered part as soon as it is reached", () => {
    const notCovered: MentorAnswer = {
      ...answer,
      parts: [{ type: "not-covered" }],
      citations: [],
    };

    expect(partialAnswer(notCovered, 1).parts).toEqual([
      { type: "not-covered" },
    ]);
  });
});
