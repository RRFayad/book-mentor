import { BookOpenIcon, ClockIcon, GlobeIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Source } from "@/lib/backend/types";
import { expiryText } from "@/lib/sources/expiry-text";
import { tw } from "@/lib/utils";

const styles = {
  row: tw(
    "flex flex-wrap items-start gap-x-4 gap-y-2 border-t py-4 first:border-t-0",
  ),
  kindIcon: tw(
    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4.5",
  ),
  main: tw("min-w-0 flex-1 basis-56"),
  title: tw("text-sm font-medium"),
  meta: tw("mt-0.5 text-[13px] text-muted-foreground"),
  progress: tw("mt-2.5 max-w-md space-y-1.5"),
  progressTrack: tw("h-1.5 overflow-hidden rounded-full bg-muted"),
  progressFill: tw("h-full rounded-full bg-primary"),
  progressText: tw("text-xs text-muted-foreground"),
  side: tw("flex items-center gap-4 pt-1.5"),
  readyBadge: tw(
    "rounded-full border border-success-border bg-success-surface px-2 py-0.5 text-xs font-medium text-success-text",
  ),
  ingestingBadge: tw(
    "rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
  ),
  expiry: tw(
    "flex w-36 items-center gap-1.5 text-[13px] [&_svg]:size-3.5 [&_svg]:text-muted-foreground",
  ),
  action: tw("flex w-24 justify-end"),
};

type SourceRowProps = {
  source: Source;
  now: Date;
  action?: ReactNode;
};

const sizeText = (source: Source): string =>
  source.kind === "book"
    ? `${source.pageCount} pages`
    : `${source.postCount} posts`;

export const SourceRow = ({ source, now, action }: SourceRowProps) => {
  const kindLabel = source.kind === "book" ? "Book" : "Blog";

  return (
    <li className={styles.row}>
      <span className={styles.kindIcon} aria-hidden>
        {source.kind === "book" ? <BookOpenIcon /> : <GlobeIcon />}
      </span>
      <div className={styles.main}>
        <p className={styles.title}>{source.title}</p>
        <p className={styles.meta}>
          {source.author} · {kindLabel} · {sizeText(source)}
        </p>
        {source.state === "ingesting" && (
          <div className={styles.progress}>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label={`Adding ${source.title}`}
              aria-valuenow={source.ingestionProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={styles.progressFill}
                style={{ width: `${source.ingestionProgress}%` }}
              />
            </div>
            <p className={styles.progressText}>
              {source.ingestionProgress}% · Keep this tab open until it&apos;s
              ready.
            </p>
          </div>
        )}
      </div>
      <div className={styles.side}>
        {source.state === "ready" ? (
          <span className={styles.readyBadge}>Ready</span>
        ) : (
          <span className={styles.ingestingBadge}>Ingesting</span>
        )}
        <span className={styles.expiry}>
          {source.state === "ready" && (
            <>
              <ClockIcon aria-hidden />
              {expiryText(source.expiresAt, now)}
            </>
          )}
        </span>
        <span className={styles.action}>{action}</span>
      </div>
    </li>
  );
};
