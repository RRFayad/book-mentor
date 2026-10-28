import type { PageBatch, PageText } from "@/lib/backend/types";

// How many pages the browser sends in one request (ADR 0001).
export const PAGES_PER_BATCH = 25;

// A text piece as pdf.js returns it: the text, and whether a line ends after it.
type TextPiece = {
  str: string;
  hasEOL: boolean;
};

// Joins a page's text pieces into lines, so later steps (like removing
// repeated headers) can work line by line.
export const pageTextFromItems = (pieces: TextPiece[]): string =>
  pieces
    .map((piece) => piece.str + (piece.hasEOL ? "\n" : ""))
    .join("")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();

// A PDF where no page has text is a scan: there is nothing to read.
export const isScanned = (pages: PageText[]): boolean =>
  pages.every((page) => page.text.trim().length === 0);

export const toPageBatches = (
  pages: PageText[],
  pagesPerBatch: number = PAGES_PER_BATCH,
): PageBatch[] => {
  const batches: PageBatch[] = [];

  for (let start = 0; start < pages.length; start += pagesPerBatch) {
    batches.push({ pages: pages.slice(start, start + pagesPerBatch) });
  }

  return batches;
};
