import { describe, expect, it } from "vitest";

import { messageAllowance } from "@/lib/usage/message-allowance";

const HOUR = 60 * 60 * 1000;
const NOW = new Date("2026-10-15T12:00:00Z");

const sent = (hoursAgo: number, answerFailed = false) => ({
  sentAt: new Date(NOW.getTime() - hoursAgo * HOUR).toISOString(),
  answerFailed,
});

describe("messageAllowance", () => {
  it("counts the messages sent in the last 24 hours", () => {
    expect(messageAllowance([sent(1), sent(5), sent(30)], NOW, 3)).toEqual({
      used: 2,
      remaining: 1,
      nextAvailableAt: null,
    });
  });

  it("at the limit, gives the time the oldest counted message leaves the window", () => {
    expect(messageAllowance([sent(1), sent(20), sent(5)], NOW, 3)).toEqual({
      used: 3,
      remaining: 0,
      nextAvailableAt: new Date(NOW.getTime() + 4 * HOUR).toISOString(),
    });
  });

  it("does not count messages whose answer failed", () => {
    expect(messageAllowance([sent(1), sent(2, true)], NOW, 2)).toEqual({
      used: 1,
      remaining: 1,
      nextAvailableAt: null,
    });
  });

  it("stops counting a message exactly 24 hours old", () => {
    expect(messageAllowance([sent(24), sent(23.99)], NOW, 2)).toEqual({
      used: 1,
      remaining: 1,
      nextAvailableAt: null,
    });
  });
});
