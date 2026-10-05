import { describe, expect, it } from "vitest";

import { expiryText } from "@/lib/sources/expiry-text";

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-10-15T12:00:00Z");

const expiresIn = (ms: number): string =>
  new Date(NOW.getTime() + ms).toISOString();

describe("expiryText", () => {
  it("counts whole days left, rounded up", () => {
    expect(expiryText(expiresIn(6.5 * 24 * HOUR), NOW)).toBe(
      "Expires in 7 days",
    );
    expect(expiryText(expiresIn(48 * HOUR), NOW)).toBe("Expires in 2 days");
    expect(expiryText(expiresIn(25 * HOUR), NOW)).toBe("Expires in 2 days");
  });

  it("says 1 day, not 1 days", () => {
    expect(expiryText(expiresIn(24 * HOUR), NOW)).toBe("Expires in 1 day");
  });

  it("says today when less than 24 hours are left", () => {
    expect(expiryText(expiresIn(23 * HOUR), NOW)).toBe("Expires today");
    expect(expiryText(expiresIn(1000), NOW)).toBe("Expires today");
    expect(expiryText(expiresIn(-HOUR), NOW)).toBe("Expires today");
  });
});
