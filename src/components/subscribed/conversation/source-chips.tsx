import { BookOpenIcon, GlobeIcon } from "lucide-react";

import type { ConversationSource } from "@/lib/backend/types";
import { tw } from "@/lib/utils";

const styles = {
  chips: tw("flex flex-wrap gap-1.5 px-0.5 pt-0.5"),
  chip: tw(
    "inline-flex h-6.5 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
  ),
};

// The Conversation's Sources, shown in the composer. They cannot be removed.
export const SourceChips = ({ sources }: { sources: ConversationSource[] }) => (
  <ul aria-label="Sources in this Conversation" className={styles.chips}>
    {sources.map((source) => (
      <li key={source.id} className={styles.chip}>
        {source.kind === "book" ? (
          <BookOpenIcon aria-hidden />
        ) : (
          <GlobeIcon aria-hidden />
        )}
        {source.title}
      </li>
    ))}
  </ul>
);
