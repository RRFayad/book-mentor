"use client";

import { BookOpenIcon, ExternalLinkIcon, GlobeIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import type { Citation } from "@/lib/backend/types";
import { tw } from "@/lib/utils";

const styles = {
  panel: tw(
    "hidden w-100 shrink-0 flex-col gap-5 overflow-y-auto border-l bg-background px-6 py-5 md:flex",
  ),
  header: tw("flex items-center justify-between"),
  title: tw("text-[15px] font-semibold"),
  details: tw("flex flex-col gap-5"),
  source: tw("flex items-start gap-3"),
  sourceIcon: tw(
    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4.5",
  ),
  sourceTitle: tw("text-sm font-medium"),
  sourceMeta: tw("mt-0.5 text-[13px] text-muted-foreground"),
  quote: tw("rounded-xl bg-muted p-4 text-sm leading-relaxed"),
  note: tw("text-xs leading-normal text-muted-foreground"),
  sheet: tw("max-h-[80svh] gap-0 overflow-y-auto rounded-t-2xl px-5 pb-7"),
};

const CitationDetails = ({ citation }: { citation: Citation }) => {
  const isBook = citation.location.kind === "page";

  return (
    <div className={styles.details}>
      <div className={styles.source}>
        <span className={styles.sourceIcon} aria-hidden>
          {isBook ? <BookOpenIcon /> : <GlobeIcon />}
        </span>
        <div>
          <p className={styles.sourceTitle}>{citation.sourceTitle}</p>
          <p className={styles.sourceMeta}>
            {citation.author} · {isBook ? "Book" : "Blog"} ·{" "}
            {citation.location.kind === "page"
              ? `Page ${citation.location.page}`
              : citation.location.postTitle}
          </p>
        </div>
      </div>
      <blockquote className={styles.quote}>{citation.quotedText}</blockquote>
      <p className={styles.note}>
        Saved with this answer, so it stays readable after the Source expires.
      </p>
      {citation.location.kind === "post" && (
        <Button variant="outline" asChild>
          <a href={citation.location.url} target="_blank" rel="noopener">
            <ExternalLinkIcon />
            Open post
          </a>
        </Button>
      )}
    </div>
  );
};

type CitationPanelProps = {
  citation: Citation | null;
  onClose: () => void;
};

// The selected Citation: a panel beside the thread on desktop, a bottom sheet
// at phone width.
export const CitationPanel = ({ citation, onClose }: CitationPanelProps) => {
  const { isMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet
        open={citation !== null}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
      >
        <SheetContent side="bottom" className={styles.sheet}>
          {citation && (
            <>
              <SheetHeader>
                <SheetTitle>Citation {citation.number}</SheetTitle>
              </SheetHeader>
              <CitationDetails citation={citation} />
            </>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  if (!citation) {
    return null;
  }

  return (
    <aside aria-label={`Citation ${citation.number}`} className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Citation {citation.number}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close citation"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <CitationDetails citation={citation} />
    </aside>
  );
};
