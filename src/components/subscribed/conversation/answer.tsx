"use client";

import type { DataMessagePartProps } from "@assistant-ui/react";
import { SearchIcon } from "lucide-react";

import { useConversation } from "@/components/subscribed/conversation/conversation-context";
import type { AnswerPart, MentorAnswer, RichText } from "@/lib/backend/types";
import {
  notAddressedLabel,
  notCoveredText,
  positionsLabel,
  sectionLabels,
} from "@/lib/conversations/answer-text";
import { cn, tw } from "@/lib/utils";

const styles = {
  answer: tw("flex flex-col gap-3"),
  heading: tw("text-base font-semibold [&:not(:first-child)]:mt-1"),
  reflection: tw("text-[13px] text-muted-foreground"),
  positions: tw("grid gap-3 sm:grid-cols-2"),
  position: tw("space-y-1 rounded-xl border p-4"),
  positionTitle: tw("text-sm font-semibold"),
  positionAuthor: tw("text-xs text-muted-foreground"),
  positionText: tw("pt-1.5 text-[15px] leading-relaxed"),
  notCovered: tw(
    "inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[15px] [&_svg]:size-4 [&_svg]:text-muted-foreground",
  ),
  marker: tw(
    "mx-0.5 inline-flex h-5 min-w-5 -translate-y-0.5 items-center justify-center rounded-md border bg-muted px-1.5 align-middle text-[11px] font-semibold text-foreground transition-colors hover:bg-accent",
  ),
  markerSelected: tw(
    "border-primary bg-primary text-primary-foreground hover:bg-primary",
  ),
  error: tw(
    "rounded-md border border-destructive bg-destructive-surface p-3 text-sm text-destructive-text",
  ),
  writing: tw(
    "inline-block size-2 animate-pulse rounded-full bg-foreground motion-reduce:animate-none",
  ),
  stopped: tw("text-[13px] text-muted-foreground"),
};

const CitationMarker = ({
  answerId,
  number,
}: {
  answerId: string;
  number: number;
}) => {
  const { selectedCitation, selectCitation } = useConversation();
  const isSelected =
    selectedCitation?.answerId === answerId &&
    selectedCitation.number === number;

  return (
    <button
      type="button"
      aria-label={`Citation ${number}`}
      aria-pressed={isSelected}
      className={cn(styles.marker, isSelected && styles.markerSelected)}
      onClick={() => selectCitation({ answerId, number })}
    >
      {number}
    </button>
  );
};

const Rich = ({ content, answerId }: { content: RichText; answerId: string }) =>
  content.map((piece, index) =>
    piece.type === "text" ? (
      <span key={index}>{piece.text}</span>
    ) : (
      <CitationMarker key={index} answerId={answerId} number={piece.number} />
    ),
  );

const Part = ({ part, answerId }: { part: AnswerPart; answerId: string }) => {
  const { sources } = useConversation();
  const source = (sourceId: string) =>
    sources.find((item) => item.id === sourceId);

  switch (part.type) {
    case "section":
      return (
        <>
          <h3 className={styles.heading}>{sectionLabels[part.section]}</h3>
          <p>
            <Rich content={part.content} answerId={answerId} />
          </p>
          {part.section === "application" && (
            <p className={styles.reflection}>
              A reflection, not a claim from your Sources.
            </p>
          )}
        </>
      );
    case "positions":
      return (
        <>
          <h3 className={styles.heading}>{positionsLabel}</h3>
          <div className={styles.positions}>
            {part.positions.map((position) => (
              <div key={position.sourceId} className={styles.position}>
                <p className={styles.positionTitle}>
                  {source(position.sourceId)?.title}
                </p>
                <p className={styles.positionAuthor}>
                  {source(position.sourceId)?.author}
                </p>
                <p className={styles.positionText}>
                  <Rich content={position.content} answerId={answerId} />
                </p>
              </div>
            ))}
          </div>
        </>
      );
    case "not-addressed":
      return (
        <>
          <h3 className={styles.heading}>
            {notAddressedLabel(source(part.sourceId)?.title ?? "a Source")}
          </h3>
          <p>
            <Rich content={part.content} answerId={answerId} />
          </p>
        </>
      );
    case "not-covered":
      return (
        <p className={styles.notCovered}>
          <SearchIcon aria-hidden />
          {notCoveredText}
        </p>
      );
    case "text":
      return (
        <p>
          <Rich content={part.content} answerId={answerId} />
        </p>
      );
  }
};

// Renders a Mentor answer: its sections, comparisons, and Citation markers,
// and whether it is still being written, was stopped, or failed.
export const Answer = ({ data }: DataMessagePartProps) => {
  // The thread puts a MentorAnswer in every "answer" part.
  const answer = data as MentorAnswer;

  if (answer.status === "error") {
    return (
      <p role="alert" className={styles.error}>
        The Mentor couldn&apos;t finish this answer. Send your question again.
      </p>
    );
  }

  return (
    <div className={styles.answer}>
      {answer.parts.map((part, index) => (
        <Part key={index} part={part} answerId={answer.id} />
      ))}
      {answer.status === "streaming" && (
        <span
          role="status"
          aria-label="The Mentor is writing"
          className={styles.writing}
        />
      )}
      {answer.status === "stopped" && <p className={styles.stopped}>Stopped</p>}
    </div>
  );
};
