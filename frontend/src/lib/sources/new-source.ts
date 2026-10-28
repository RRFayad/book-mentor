import type { NewSource } from "@/lib/backend/types";

const isFilled = (value: string): boolean => value.trim().length > 0;

const isWebAddress = (value: string): boolean => {
  try {
    const url = new URL(value.trim());

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
};

// The Add Source form can be sent only when this is true.
export const isNewSourceValid = (source: NewSource): boolean => {
  if (!isFilled(source.title) || !isFilled(source.author)) {
    return false;
  }

  // A book counts once the browser has read its pages.
  return source.kind === "book"
    ? source.fileName.toLowerCase().endsWith(".pdf") && source.pageCount > 0
    : isWebAddress(source.address);
};
