import { describe, expect, it } from "vitest";

import type { ConversationSummary } from "@/lib/backend/types";
import { groupConversationsByDate } from "@/lib/conversations/group-by-date";

// Dates use the local-time Date constructor, so the tests pass in any time zone.
const local = (day: number, hour = 12, minute = 0): Date =>
  new Date(2026, 9, day, hour, minute);

const conversation = (id: string, lastActivity: Date): ConversationSummary => ({
  id,
  title: `Conversation ${id}`,
  lastActivityAt: lastActivity.toISOString(),
});

const NOW = local(15, 10);

const groupIds = (conversations: ConversationSummary[]) =>
  groupConversationsByDate(conversations, NOW).map((group) => ({
    label: group.label,
    ids: group.conversations.map((item) => item.id),
  }));

describe("groupConversationsByDate", () => {
  it("puts each Conversation in Today, Previous 7 days, or Older", () => {
    expect(
      groupIds([
        conversation("today", local(15, 8)),
        conversation("yesterday", local(14)),
        conversation("last-month", local(1)),
      ]),
    ).toEqual([
      { label: "Today", ids: ["today"] },
      { label: "Previous 7 days", ids: ["yesterday"] },
      { label: "Older", ids: ["last-month"] },
    ]);
  });

  it("splits Today and Previous 7 days at local midnight", () => {
    expect(
      groupIds([
        conversation("just-after-midnight", local(15, 0, 0)),
        conversation("just-before-midnight", local(14, 23, 59)),
      ]),
    ).toEqual([
      { label: "Today", ids: ["just-after-midnight"] },
      { label: "Previous 7 days", ids: ["just-before-midnight"] },
    ]);
  });

  it("keeps the 7th day before today in Previous 7 days and the 8th in Older", () => {
    expect(
      groupIds([
        conversation("seventh-day", local(8, 0, 0)),
        conversation("eighth-day", local(7, 23, 59)),
      ]),
    ).toEqual([
      { label: "Previous 7 days", ids: ["seventh-day"] },
      { label: "Older", ids: ["eighth-day"] },
    ]);
  });

  it("orders each group newest first", () => {
    expect(
      groupIds([
        conversation("morning", local(15, 7)),
        conversation("dawn", local(15, 5)),
        conversation("late-morning", local(15, 9)),
      ]),
    ).toEqual([{ label: "Today", ids: ["late-morning", "morning", "dawn"] }]);
  });

  it("leaves out empty groups", () => {
    expect(groupIds([conversation("old", local(1))])).toEqual([
      { label: "Older", ids: ["old"] },
    ]);
    expect(groupIds([])).toEqual([]);
  });
});
