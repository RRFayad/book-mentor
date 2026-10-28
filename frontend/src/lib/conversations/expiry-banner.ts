import type { ConversationSource } from "@/lib/backend/types";

// The banner shown when every Source of a Conversation has expired. The
// Conversation stays open: passages already cited remain evidence (ADR 0003).
export const expiryBannerText = (
  sources: ConversationSource[],
): { title: string; text: string } | null => {
  if (sources.length === 0 || sources.some((source) => !source.expired)) {
    return null;
  }

  return {
    title:
      sources.length === 1
        ? `${sources[0].title} has expired.`
        : "All Sources in this Conversation have expired.",
    text: "You can keep going: the Mentor can still use passages already cited here, but it can't search the expired Sources for anything new.",
  };
};
