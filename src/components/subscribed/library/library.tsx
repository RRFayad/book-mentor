import {
  BookOpenIcon,
  GlobeIcon,
  LibraryIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AddSourceButton } from "@/components/subscribed/library/add-source-dialog";
import { SourceRow } from "@/components/subscribed/library/source-row";
import { UsageCard } from "@/components/subscribed/library/usage-card";
import { PageHeader } from "@/components/subscribed/page-header";
import type { Source, Usage } from "@/lib/backend/types";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-6"),
  card: tw("rounded-xl border bg-card p-6 shadow-sm"),
  cardTitle: tw("text-lg font-semibold"),
  notice: tw(
    "mt-4 flex gap-3 rounded-lg border border-warning-border bg-warning-surface p-4 text-sm text-warning-text",
  ),
  noticeIcon: tw("mt-0.5 size-4 shrink-0"),
  list: tw("mt-2"),
  empty: tw(
    "flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-8 py-16 text-center",
  ),
  emptyIcon: tw(
    "flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground",
  ),
  emptyTitle: tw("mt-2 text-lg font-semibold"),
  emptyText: tw("max-w-md text-sm text-muted-foreground"),
  emptyActions: tw("mt-3 flex flex-wrap justify-center gap-2"),
};

type LibraryProps = {
  sources: Source[];
  usage: Usage;
  now: Date;
};

export const Library = ({ sources, usage, now }: LibraryProps) => {
  const atLimit = usage.activeSources >= usage.sourceLimit;

  return (
    <main className={styles.page}>
      <PageHeader
        title="Library"
        description="The books and blogs your Mentor draws on, and how much of your allowance you've used."
        action={
          <AddSourceButton disabled={atLimit}>
            <PlusIcon />
            Add Source
          </AddSourceButton>
        }
      />
      <UsageCard usage={usage} />
      {sources.length === 0 ? (
        <section className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden>
            <LibraryIcon />
          </span>
          <h2 className={styles.emptyTitle}>Your Library is empty</h2>
          <p className={styles.emptyText}>
            Add a book as a text-based PDF, or a blog by its address. Once
            it&apos;s ready, you can start a Conversation with it.
          </p>
          <div className={styles.emptyActions}>
            <AddSourceButton initialKind="book">
              <BookOpenIcon />
              Add a book
            </AddSourceButton>
            <AddSourceButton initialKind="blog" variant="outline">
              <GlobeIcon />
              Add a blog
            </AddSourceButton>
          </div>
        </section>
      ) : (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Sources</h2>
          {atLimit && (
            <p className={styles.notice}>
              <TriangleAlertIcon className={styles.noticeIcon} aria-hidden />
              You have {usage.activeSources} of {usage.sourceLimit} active
              Sources. Delete one to add another.
            </p>
          )}
          <ul className={styles.list}>
            {sources.map((source) => (
              <SourceRow key={source.id} source={source} now={now} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};
