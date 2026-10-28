import type {
  AnswerPart,
  AnswerSection,
  ConversationSource,
  MentorAnswer,
  RichText,
} from "@/lib/backend/types";

// Headings shown for answer sections, on screen and in copied text.
export const sectionLabels: Record<AnswerSection, string> = {
  "source-says": "What the Source says",
  meaning: "What it means",
  application: "How to apply it",
  agreements: "Agreements",
  conflicts: "Conflicts",
};

export const positionsLabel = "Each Source's position";
export const notCoveredText =
  "I couldn't find anything about this in your Sources.";
export const notAddressedLabel = (sourceTitle: string): string =>
  `Not addressed by ${sourceTitle}`;

const richTextToPlain = (content: RichText): string =>
  content
    .map((piece) => (piece.type === "text" ? piece.text : ` [${piece.number}]`))
    .join("");

const partToPlain = (
  part: AnswerPart,
  sourceTitle: (sourceId: string) => string,
): string => {
  switch (part.type) {
    case "section":
      return `${sectionLabels[part.section]}\n${richTextToPlain(part.content)}`;
    case "positions":
      return [
        positionsLabel,
        ...part.positions.map(
          (position) =>
            `${sourceTitle(position.sourceId)}: ${richTextToPlain(position.content)}`,
        ),
      ].join("\n");
    case "not-addressed":
      return `${notAddressedLabel(sourceTitle(part.sourceId))}\n${richTextToPlain(part.content)}`;
    case "not-covered":
      return notCoveredText;
    case "text":
      return richTextToPlain(part.content);
  }
};

// The text the Copy button puts on the clipboard: sections under their
// headings, Citations as [n].
export const answerToPlainText = (
  answer: MentorAnswer,
  sources: ConversationSource[],
): string => {
  const sourceTitle = (sourceId: string): string =>
    sources.find((source) => source.id === sourceId)?.title ?? "a Source";

  return answer.parts
    .map((part) => partToPlain(part, sourceTitle))
    .join("\n\n");
};
