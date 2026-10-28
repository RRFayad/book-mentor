"use client";

import { ClockIcon } from "lucide-react";

import { useIsBrowser } from "@/hooks/use-is-browser";
import type { Usage } from "@/lib/backend/types";
import { tw } from "@/lib/utils";

const styles = {
  left: tw("text-center text-xs text-muted-foreground"),
  limit: tw(
    "flex gap-3 rounded-xl border border-warning-border bg-warning-surface px-4 py-3 text-sm text-warning-text [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  ),
};

const localTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// "N of 50 messages left", or the limit notice once none are left.
export const MessageAllowance = ({ usage }: { usage: Usage }) => {
  const isBrowser = useIsBrowser();
  const left = Math.max(0, usage.messageLimit - usage.messagesInWindow);

  if (left > 0) {
    return (
      <p className={styles.left}>
        {left} of {usage.messageLimit} messages left
      </p>
    );
  }

  return (
    <p role="status" className={styles.limit}>
      <ClockIcon aria-hidden />
      <span>
        <strong>
          You&apos;ve sent {usage.messageLimit} messages in the last 24 hours.
        </strong>{" "}
        {/* The time is local to the user, so it renders in the browser only. */}
        {isBrowser && usage.nextMessageAvailableAt
          ? `You can send more at ${localTime(usage.nextMessageAvailableAt)}.`
          : null}
      </span>
    </p>
  );
};
