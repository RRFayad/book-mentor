import { describe, expect, it } from "vitest";

import {
  isScanned,
  pageTextFromItems,
  toPageBatches,
} from "@/lib/sources/pdf-pages";

describe("pageTextFromItems", () => {
  it("joins pdf.js text pieces into lines", () => {
    expect(
      pageTextFromItems([
        { str: "HEAVY DUTY", hasEOL: true },
        { str: "Chapter 1.", hasEOL: false },
        { str: " The theory", hasEOL: true },
        { str: "of intensity", hasEOL: false },
      ]),
    ).toBe("HEAVY DUTY\nChapter 1. The theory\nof intensity");
  });

  it("drops trailing spaces and empty edges", () => {
    expect(
      pageTextFromItems([
        { str: "  ", hasEOL: true },
        { str: "Text   ", hasEOL: true },
        { str: "", hasEOL: true },
      ]),
    ).toBe("Text");
  });
});

describe("isScanned", () => {
  it("is true when no page has text", () => {
    expect(
      isScanned([
        { page: 1, text: "" },
        { page: 2, text: " \n " },
      ]),
    ).toBe(true);
  });

  it("is false when any page has text", () => {
    expect(
      isScanned([
        { page: 1, text: "" },
        { page: 2, text: "Hi" },
      ]),
    ).toBe(false);
  });
});

describe("toPageBatches", () => {
  const pages = Array.from({ length: 60 }, (_, index) => ({
    page: index + 1,
    text: `Page ${index + 1}`,
  }));

  it("splits pages into batches of 25, in order", () => {
    const batches = toPageBatches(pages, 25);

    expect(batches.map((batch) => batch.pages.length)).toEqual([25, 25, 10]);
    expect(batches[1].pages[0].page).toBe(26);
    expect(batches[2].pages.at(-1)?.page).toBe(60);
  });

  it("gives one batch for a short book", () => {
    expect(toPageBatches(pages.slice(0, 3), 25)).toHaveLength(1);
  });
});
