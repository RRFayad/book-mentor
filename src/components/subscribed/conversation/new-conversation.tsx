"use client";

import { Popover } from "@base-ui/react/popover";
import {
  ArrowUpIcon,
  BookOpenIcon,
  GlobeIcon,
  LibraryIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createConversationAction } from "@/actions/conversations";
import { showToast } from "@/components/toaster";
import { AddSourceButton } from "@/components/subscribed/library/add-source-dialog";
import { Button } from "@/components/ui/button";
import type { Source } from "@/lib/backend/types";
import {
  canStartConversation,
  SOURCE_PICK_LIMIT,
  toggleSourcePick,
} from "@/lib/conversations/source-picks";
import { routes } from "@/lib/routes";
import { cn, tw } from "@/lib/utils";

const styles = {
  page: tw(
    "mx-auto flex w-full max-w-176 flex-col px-4 pt-[18vh] pb-10 sm:pt-[22vh]",
  ),
  welcome: tw("px-2 text-2xl font-medium tracking-tight"),
  intro: tw("mt-1.5 mb-6 px-2 text-[15px] text-muted-foreground"),
  composer: tw(
    "flex w-full flex-col gap-2 rounded-2xl border border-foreground/10 bg-muted/30 p-2 transition-colors focus-within:border-foreground/25",
  ),
  chips: tw("flex flex-wrap gap-1.5 px-0.5 pt-0.5"),
  chip: tw(
    "inline-flex h-7 items-center gap-1.5 rounded-full border bg-background ps-2.5 pe-1 text-[13px] [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
  ),
  chipRemove: tw(
    "flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3",
  ),
  input: tw(
    "min-h-10 w-full resize-none bg-transparent px-2.5 py-1 text-base leading-6 outline-none placeholder:text-muted-foreground/70",
  ),
  actions: tw("flex items-center justify-between gap-3"),
  pickerButton: tw("rounded-full"),
  sendButton: tw("rounded-full"),
  hint: tw("mt-2.5 text-center text-xs text-muted-foreground"),
  popup: tw(
    "z-50 w-[min(28rem,calc(100vw-2rem))] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none",
  ),
  popupHeader: tw("flex items-center justify-between px-2.5 py-2"),
  popupTitle: tw("text-[13px] font-semibold"),
  popupCount: tw("text-xs text-muted-foreground"),
  option: tw(
    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start hover:bg-muted has-disabled:opacity-55 has-disabled:hover:bg-transparent",
  ),
  optionChecked: tw("bg-muted"),
  checkbox: tw("size-4 shrink-0 accent-primary"),
  optionText: tw("min-w-0 flex-1"),
  optionTitle: tw("block truncate text-sm font-medium"),
  optionMeta: tw("block text-xs text-muted-foreground"),
  popupFooter: tw(
    "mt-1.5 flex items-center justify-between border-t px-1 pt-1.5 text-[13px]",
  ),
  libraryLink: tw("px-2 text-muted-foreground hover:text-foreground"),
  empty: tw(
    "mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4 pt-[22vh] text-center",
  ),
  emptyIcon: tw(
    "flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground",
  ),
  emptyTitle: tw("mt-2 text-2xl font-medium tracking-tight"),
  emptyText: tw("text-[15px] text-muted-foreground"),
  emptyActions: tw("mt-3 flex flex-wrap justify-center gap-2"),
};

const sourceMeta = (source: Source): string => {
  const kind = source.kind === "book" ? "Book" : "Blog";

  if (source.state === "ingesting") {
    return `${kind} · Ingesting ${source.ingestionProgress}% · available once it's ready`;
  }

  return `${source.author} · ${kind} · ${
    source.kind === "book"
      ? `${source.pageCount} pages`
      : `${source.postCount} posts`
  }`;
};

const SourceIcon = ({ source }: { source: Source }) =>
  source.kind === "book" ? (
    <BookOpenIcon aria-hidden />
  ) : (
    <GlobeIcon aria-hidden />
  );

const EmptyLibrary = () => (
  <main className={styles.empty}>
    <span className={styles.emptyIcon} aria-hidden>
      <LibraryIcon />
    </span>
    <h1 className={styles.emptyTitle}>Add a Source to get started</h1>
    <p className={styles.emptyText}>
      The Mentor answers only from the books and blogs in your Library. Add one,
      and once it&apos;s ready you can start your first Conversation.
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
  </main>
);

type NewConversationProps = {
  sources: Source[];
};

export const NewConversation = ({ sources }: NewConversationProps) => {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();

  if (sources.length === 0) {
    return <EmptyLibrary />;
  }

  const pickedSources = picked.flatMap((id) => {
    const source = sources.find((item) => item.id === id);

    return source ? [source] : [];
  });
  const canSend = canStartConversation(picked, question) && !isPending;

  const start = () => {
    if (!canSend) {
      return;
    }

    startTransition(async () => {
      const result = await createConversationAction(picked, question);

      if (result.status === "limit-reached") {
        showToast({
          type: "warning",
          title: "You've sent 50 messages in the last 24 hours.",
          message: "Start this Conversation once more messages are available.",
        });
        return;
      }

      if (result.status === "failed") {
        showToast({
          type: "error",
          title: "Couldn't start the Conversation.",
          message: "Check your Sources and try again.",
        });
        return;
      }

      // The thread sends the first question, so its answer streams.
      router.push(
        `${routes.conversations.detail(result.conversationId)}?ask=${encodeURIComponent(question.trim())}`,
      );
    });
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.welcome}>What do you want to explore?</h1>
      <p className={styles.intro}>
        Pick up to {SOURCE_PICK_LIMIT} Sources from your Library, then ask your
        first question.
      </p>

      <form
        className={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          start();
        }}
      >
        {pickedSources.length > 0 && (
          <ul aria-label="Picked Sources" className={styles.chips}>
            {pickedSources.map((source) => (
              <li key={source.id} className={styles.chip}>
                <SourceIcon source={source} />
                {source.title}
                <button
                  type="button"
                  aria-label={`Remove ${source.title}`}
                  className={styles.chipRemove}
                  onClick={() => setPicked(toggleSourcePick(picked, source))}
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        <textarea
          aria-label="Your first question"
          placeholder="Ask your first question…"
          rows={2}
          className={styles.input}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              start();
            }
          }}
        />
        <div className={styles.actions}>
          <Popover.Root>
            <Popover.Trigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={styles.pickerButton}
                />
              }
            >
              <PlusIcon />
              Sources · {picked.length} of {SOURCE_PICK_LIMIT}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side="bottom" align="start" sideOffset={8}>
                <Popover.Popup
                  aria-label="Choose Sources"
                  className={styles.popup}
                >
                  <div className={styles.popupHeader}>
                    <span className={styles.popupTitle}>
                      Choose up to {SOURCE_PICK_LIMIT} Sources
                    </span>
                    <span className={styles.popupCount}>
                      {picked.length} of {SOURCE_PICK_LIMIT} selected
                    </span>
                  </div>
                  {sources.map((source) => {
                    const isPicked = picked.includes(source.id);
                    const isDisabled =
                      source.state !== "ready" ||
                      (!isPicked && picked.length >= SOURCE_PICK_LIMIT);

                    return (
                      <label
                        key={source.id}
                        className={cn(
                          styles.option,
                          isPicked && styles.optionChecked,
                        )}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isPicked}
                          disabled={isDisabled}
                          onChange={() =>
                            setPicked(toggleSourcePick(picked, source))
                          }
                        />
                        <span className={styles.optionText}>
                          <span className={styles.optionTitle}>
                            {source.title}
                          </span>
                          <span className={styles.optionMeta}>
                            {sourceMeta(source)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                  <div className={styles.popupFooter}>
                    <AddSourceButton variant="ghost" size="sm">
                      <PlusIcon />
                      Add a Source
                    </AddSourceButton>
                    <Link href={routes.library} className={styles.libraryLink}>
                      Open Library
                    </Link>
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <Button
            type="submit"
            size="icon-sm"
            className={styles.sendButton}
            aria-label="Start Conversation"
            disabled={!canSend}
          >
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
      <p className={styles.hint}>
        Sources can&apos;t be changed once the Conversation starts.
      </p>
    </main>
  );
};
