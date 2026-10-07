import { describe, expect, it } from "vitest";

import type { NewSource } from "@/lib/backend/types";
import { isNewSourceValid } from "@/lib/sources/new-source";

const book = (overrides: Partial<Extract<NewSource, { kind: "book" }>> = {}) =>
  ({
    kind: "book",
    fileName: "heavy-duty.pdf",
    pageCount: 212,
    title: "Heavy Duty",
    author: "Mike Mentzer",
    ...overrides,
  }) satisfies NewSource;

const blog = (overrides: Partial<Extract<NewSource, { kind: "blog" }>> = {}) =>
  ({
    kind: "blog",
    address: "https://www.baye.com/",
    title: "Drew Baye's blog",
    author: "Drew Baye",
    ...overrides,
  }) satisfies NewSource;

describe("isNewSourceValid", () => {
  it("accepts a complete book and a complete blog", () => {
    expect(isNewSourceValid(book())).toBe(true);
    expect(isNewSourceValid(blog())).toBe(true);
  });

  it("requires a title and an author that are not blank", () => {
    expect(isNewSourceValid(book({ title: "  " }))).toBe(false);
    expect(isNewSourceValid(blog({ author: "" }))).toBe(false);
  });

  it("requires a PDF file for a book", () => {
    expect(isNewSourceValid(book({ fileName: "" }))).toBe(false);
    expect(isNewSourceValid(book({ fileName: "notes.txt" }))).toBe(false);
    expect(isNewSourceValid(book({ fileName: "HEAVY-DUTY.PDF" }))).toBe(true);
  });

  it("requires a book whose pages have been read", () => {
    expect(isNewSourceValid(book({ pageCount: 0 }))).toBe(false);
  });

  it("requires a blog address that starts with http:// or https://", () => {
    expect(isNewSourceValid(blog({ address: "www.baye.com" }))).toBe(false);
    expect(isNewSourceValid(blog({ address: "ftp://baye.com" }))).toBe(false);
    expect(isNewSourceValid(blog({ address: "https://" }))).toBe(false);
    expect(isNewSourceValid(blog({ address: "http://baye.com/blog" }))).toBe(
      true,
    );
  });
});
