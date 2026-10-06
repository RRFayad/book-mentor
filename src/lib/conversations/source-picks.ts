import type { Source } from "@/lib/backend/types";

export const SOURCE_PICK_LIMIT = 3;
const TITLE_MAX_LENGTH = 60;

// Picking a Source in New Conversation: only Ready Sources, at most 3, and
// picking a picked Source again removes it.
export const toggleSourcePick = (
  picked: string[],
  source: Source,
): string[] => {
  if (picked.includes(source.id)) {
    return picked.filter((id) => id !== source.id);
  }

  if (source.state !== "ready" || picked.length >= SOURCE_PICK_LIMIT) {
    return picked;
  }

  return [...picked, source.id];
};

export const canStartConversation = (
  picked: string[],
  question: string,
): boolean =>
  picked.length >= 1 &&
  picked.length <= SOURCE_PICK_LIMIT &&
  question.trim().length > 0;

// A new Conversation's title is its first question, cut at a word before 60
// characters, with an ellipsis when cut.
export const titleFromQuestion = (question: string): string => {
  const tidy = question.trim().replace(/\s+/g, " ");

  if (tidy.length <= TITLE_MAX_LENGTH) {
    return tidy;
  }

  const cut = tidy.slice(0, TITLE_MAX_LENGTH - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" ")) || cut;

  return `${atWord.replace(/[\s,;:.-]+$/, "")}…`;
};
