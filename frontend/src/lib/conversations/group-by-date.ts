import type { ConversationSummary } from "@/lib/backend/types";

export type ConversationGroupLabel = "Today" | "Previous 7 days" | "Older";

export type ConversationGroup = {
  label: ConversationGroupLabel;
  conversations: ConversationSummary[];
};

const startOfLocalDay = (date: Date, daysBefore = 0): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysBefore);

// Groups Conversations by last activity, in the user's local time.
// Today: today's date. Previous 7 days: one of the 7 dates before today.
// Older: anything before that. Newest first; empty groups are left out.
export const groupConversationsByDate = (
  conversations: ConversationSummary[],
  now: Date,
): ConversationGroup[] => {
  const todayStart = startOfLocalDay(now).getTime();
  const previousStart = startOfLocalDay(now, 7).getTime();

  const groups: ConversationGroup[] = [
    { label: "Today", conversations: [] },
    { label: "Previous 7 days", conversations: [] },
    { label: "Older", conversations: [] },
  ];

  const newestFirst = [...conversations].sort(
    (a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt),
  );

  for (const conversation of newestFirst) {
    const lastActivity = Date.parse(conversation.lastActivityAt);
    const index =
      lastActivity >= todayStart ? 0 : lastActivity >= previousStart ? 1 : 2;

    groups[index].conversations.push(conversation);
  }

  return groups.filter((group) => group.conversations.length > 0);
};
