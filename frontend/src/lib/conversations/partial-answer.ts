import type { AnswerPart, MentorAnswer, RichText } from "@/lib/backend/types";

// Mock streaming shows an answer a few words at a time. These functions cut an
// answer down to its first N words.

const countWords = (text: string): number => text.match(/\S+/g)?.length ?? 0;

const richWords = (content: RichText): number =>
  content.reduce(
    (total, piece) =>
      piece.type === "text" ? total + countWords(piece.text) : total,
    0,
  );

const partWords = (part: AnswerPart): number => {
  switch (part.type) {
    case "positions":
      return part.positions.reduce(
        (total, position) => total + richWords(position.content),
        0,
      );
    case "not-covered":
      // Shown whole, as soon as it is reached.
      return 1;
    default:
      return richWords(part.content);
  }
};

export const answerWordCount = (answer: MentorAnswer): number =>
  answer.parts.reduce((total, part) => total + partWords(part), 0);

// The text up to the end of its first `words` words.
const firstWords = (text: string, words: number): string => {
  const pattern = /\S+/g;
  let end = 0;

  for (let count = 0; count < words; count++) {
    const match = pattern.exec(text);

    if (!match) {
      break;
    }

    end = match.index + match[0].length;
  }

  return text.slice(0, end);
};

// A Citation marker is kept once every word before it is shown.
const cutRich = (content: RichText, budget: number) => {
  const kept: RichText = [];
  let used = 0;

  for (const piece of content) {
    if (piece.type === "citation") {
      kept.push(piece);
      continue;
    }

    const words = countWords(piece.text);

    if (used + words <= budget) {
      kept.push(piece);
      used += words;
      continue;
    }

    if (budget - used > 0) {
      kept.push({ type: "text", text: firstWords(piece.text, budget - used) });
    }

    used = budget;
    break;
  }

  return { content: kept, used, complete: used === richWords(content) };
};

export const partialAnswer = (
  answer: MentorAnswer,
  words: number,
): MentorAnswer => {
  const parts: AnswerPart[] = [];
  let left = words;

  for (const part of answer.parts) {
    if (left <= 0) {
      break;
    }

    if (part.type === "not-covered") {
      parts.push(part);
      left -= 1;
      continue;
    }

    if (part.type === "positions") {
      const positions = [];
      let complete = true;

      for (const position of part.positions) {
        if (left <= 0) {
          complete = false;
          break;
        }

        const cut = cutRich(position.content, left);

        positions.push({ ...position, content: cut.content });
        left -= cut.used;
        complete = cut.complete;

        if (!complete) {
          break;
        }
      }

      parts.push({ ...part, positions });

      if (!complete) {
        break;
      }

      continue;
    }

    const cut = cutRich(part.content, left);

    parts.push({ ...part, content: cut.content });
    left -= cut.used;

    if (!cut.complete) {
      break;
    }
  }

  const shownCitations = new Set(
    parts.flatMap((part) => {
      const contents =
        part.type === "positions"
          ? part.positions.map((position) => position.content)
          : part.type === "not-covered"
            ? []
            : [part.content];

      return contents.flatMap((content) =>
        content.flatMap((piece) =>
          piece.type === "citation" ? [piece.number] : [],
        ),
      );
    }),
  );

  return {
    ...answer,
    status: "streaming",
    parts,
    citations: answer.citations.filter((citation) =>
      shownCitations.has(citation.number),
    ),
  };
};
