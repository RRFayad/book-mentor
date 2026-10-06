import { BookOpenIcon, GlobeIcon } from "lucide-react";

import type { ConversationSource } from "@/lib/backend/types";
import { cn, tw } from "@/lib/utils";

const styles = {
  chips: tw("flex flex-wrap gap-1.5 px-0.5 pt-0.5"),
  chip: tw(
    "inline-flex h-6.5 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
  ),
  expiredChip: tw(
    "border-dashed border-warning-border bg-warning-surface text-warning-text [&_svg]:text-warning-text",
  ),
  expiredTitle: tw("line-through"),
  expiredLabel: tw("font-medium"),
};

// The Conversation's Sources, shown in the composer. They cannot be removed;
// an expired Source stays listed, crossed out.
export const SourceChips = ({ sources }: { sources: ConversationSource[] }) => (
  <ul aria-label="Sources in this Conversation" className={styles.chips}>
    {sources.map((source) => (
      <li
        key={source.id}
        className={cn(styles.chip, source.expired && styles.expiredChip)}
      >
        {source.kind === "book" ? (
          <BookOpenIcon aria-hidden />
        ) : (
          <GlobeIcon aria-hidden />
        )}
        {source.expired ? (
          <>
            <span className={styles.expiredTitle}>{source.title}</span>
            <span className={styles.expiredLabel}>Expired</span>
          </>
        ) : (
          source.title
        )}
      </li>
    ))}
  </ul>
);
