"use client";

import { MAX_TITLE_LENGTH } from "@app/shared/constants";
import {
  BookOpenIcon,
  GlobeIcon,
  LoaderCircleIcon,
  LockIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  addSourceAction,
  completeSourceAction,
  sendPageBatchesAction,
} from "@/actions/sources";
import { showToast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { NewSource, SourceKind } from "@/lib/backend/types";
import { isNewSourceValid } from "@/lib/sources/new-source";
import {
  isScanned,
  PARALLEL_BATCHES,
  toPageBatches,
} from "@/lib/sources/pdf-pages";
import { readPdf, type PdfBook } from "@/lib/sources/read-pdf";
import { cn, tw } from "@/lib/utils";

const styles = {
  content: tw("sm:max-w-lg"),
  shareOption: tw("flex items-center gap-2 text-sm"),
  tabs: tw("grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"),
  tab: tw(
    "flex h-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors [&_svg]:size-4",
  ),
  tabActive: tw("bg-background text-foreground shadow-sm"),
  tabDisabled: tw("cursor-not-allowed opacity-50"),
  fields: tw("space-y-4"),
  field: tw("space-y-1.5"),
  label: tw("text-sm font-medium"),
  hint: tw("text-xs text-muted-foreground"),
  note: tw("flex gap-2 text-[13px] text-muted-foreground [&_svg]:mt-0.5"),
  noteIcon: tw("size-3.5 shrink-0"),
  fileStatus: tw("text-xs text-muted-foreground"),
  rejection: tw(
    "rounded-lg border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive-text",
  ),
  sending: tw("space-y-2 rounded-lg border bg-muted/40 p-3"),
  sendingTrack: tw("flex h-1.5 overflow-hidden rounded-full bg-muted"),
  sendingDone: tw("h-full bg-primary transition-[width] duration-500"),
  sendingInFlight: tw(
    "h-full animate-pulse bg-primary/40 transition-[width] duration-500",
  ),
  sendingStep: tw("flex items-center gap-2 text-sm"),
  sendingIcon: tw("size-4 shrink-0 animate-spin text-primary"),
  sendingHint: tw("text-xs text-muted-foreground"),
};

const rejectionMessages = {
  scanned:
    "This PDF has no text we can read. It looks like a scan. Only text-based PDFs can be added for now.",
  "too-large": "This PDF has too many pages. Books can have up to 500 pages.",
  "limit-reached": "You have 3 of 3 active Sources. Delete one to add another.",
  unreadable: "This file couldn't be read as a PDF.",
} as const;

const MAX_BOOK_PAGES = 500;

type Rejection = keyof typeof rejectionMessages;

// While a book is sent: the pages already done, the pages being sent now
// (as percents of the book), and what is happening.
type SendingProgress = {
  donePercent: number;
  inFlightPercent: number;
  step: string;
};

const toPercent = (part: number, whole: number) =>
  Math.round((part / whole) * 100);

type AddSourceFormProps = {
  initialKind: SourceKind;
  // Admins only: share the book with every reader (the demo book).
  canShare: boolean;
  onDone: () => void;
  // Tells the dialog when a book is being sent, so it can't be closed then.
  onSendingChange: (isSending: boolean) => void;
};

const AddSourceForm = ({
  initialKind,
  canShare,
  onDone,
  onSendingChange,
}: AddSourceFormProps) => {
  const id = useId();
  const [kind, setKind] = useState<SourceKind>(initialKind);
  const [fileName, setFileName] = useState("");
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [rejection, setRejection] = useState<Rejection | null>(null);
  const [isPending, startTransition] = useTransition();
  // The book as the browser read it; null until the PDF has been read.
  const [book, setBook] = useState<PdfBook | null>(null);
  const [readingPage, setReadingPage] = useState<string | null>(null);
  const [sending, setSending] = useState<SendingProgress | null>(null);
  const [shared, setShared] = useState(false);
  const isSending = sending !== null;

  // Closing the tab stops sending the book (ADR 0001), so the browser asks first.
  useEffect(() => {
    onSendingChange(isSending);

    if (!isSending) {
      return;
    }

    const askBeforeLeaving = (event: BeforeUnloadEvent) =>
      event.preventDefault();

    window.addEventListener("beforeunload", askBeforeLeaving);

    return () => window.removeEventListener("beforeunload", askBeforeLeaving);
  }, [isSending, onSendingChange]);

  const source: NewSource =
    kind === "book"
      ? {
          kind,
          fileName,
          pageCount: book?.pageCount ?? 0,
          title,
          author,
          shared,
        }
      : { kind, address, title, author };

  const readBook = async (file: File | undefined) => {
    setFileName(file?.name ?? "");
    setBook(null);
    setRejection(null);

    if (!file) {
      return;
    }

    try {
      const read = await readPdf(file, (page, pageCount) =>
        setReadingPage(`Reading page ${page} of ${pageCount}…`),
      );

      if (isScanned(read.pages)) {
        setRejection("scanned");
      } else if (read.pageCount > MAX_BOOK_PAGES) {
        setRejection("too-large");
      } else {
        setBook(read);
        setTitle((current) => current || read.title);
        setAuthor((current) => current || read.author);
      }
    } catch {
      setRejection("unreadable");
    } finally {
      setReadingPage(null);
    }
  };

  // Sends the book's pages to the backend in batches, a few at once (ADR 0001).
  // Server Actions run one at a time, so progress moves once per group.
  const sendPages = async (sourceId: string, pages: PdfBook["pages"]) => {
    const batches = toPageBatches(pages);
    const lastPage = pages.at(-1)?.page ?? pages.length;
    let donePages = 0;

    for (let start = 0; start < batches.length; start += PARALLEL_BATCHES) {
      const group = batches.slice(start, start + PARALLEL_BATCHES);
      const groupPages = group.flatMap((batch) => batch.pages);
      const firstInGroup = groupPages[0].page;
      const lastInGroup = groupPages[groupPages.length - 1].page;

      setSending({
        donePercent: toPercent(donePages, pages.length),
        inFlightPercent: toPercent(groupPages.length, pages.length),
        step: `The Mentor is studying pages ${firstInGroup}–${lastInGroup} of ${lastPage}…`,
      });

      const { ok } = await sendPageBatchesAction(sourceId, group);

      if (!ok) {
        return false;
      }

      donePages += groupPages.length;
    }

    // Completing writes the book's One Page, which takes a few seconds.
    setSending({
      donePercent: 100,
      inFlightPercent: 0,
      step: "The Mentor is writing its big picture of the book…",
    });
    const { ok } = await completeSourceAction(sourceId);

    return ok;
  };

  const chooseKind = (nextKind: SourceKind) => {
    setKind(nextKind);
    setRejection(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setRejection(null);

    startTransition(async () => {
      const result = await addSourceAction(source);

      if (result.status === "added") {
        const sent =
          kind !== "book" || !book
            ? true
            : await sendPages(result.source.id, book.pages);

        setSending(null);
        onDone();

        if (!sent) {
          showToast({
            type: "error",
            title: `Couldn't send the text of ${title.trim()}.`,
            message: "Try adding it again.",
          });
        }
      } else if (result.status === "failed") {
        onDone();
        showToast({
          type: "error",
          title: `Couldn't add ${title.trim()}.`,
          message: "Try adding it again.",
        });
      } else if (result.status === "rejected") {
        setRejection(result.reason);
      } else {
        setRejection("limit-reached");
      }
    });
  };

  return (
    <form onSubmit={submit} className={styles.fields}>
      <div role="tablist" aria-label="Kind of Source" className={styles.tabs}>
        <button
          type="button"
          role="tab"
          aria-selected={kind === "book"}
          className={cn(styles.tab, kind === "book" && styles.tabActive)}
          onClick={() => chooseKind("book")}
        >
          <BookOpenIcon aria-hidden />
          Book (PDF)
        </button>
        {/* Blogs arrive in #21; until then the tab is shown but disabled. */}
        <button
          type="button"
          role="tab"
          aria-selected={false}
          disabled
          className={cn(styles.tab, styles.tabDisabled)}
        >
          <GlobeIcon aria-hidden />
          Blog · Coming soon
        </button>
      </div>

      {kind === "book" ? (
        <div className={styles.field}>
          <label htmlFor={`${id}-file`} className={styles.label}>
            PDF file
          </label>
          <Input
            id={`${id}-file`}
            type="file"
            accept=".pdf,application/pdf"
            required
            onChange={(event) => readBook(event.target.files?.[0])}
          />
          {readingPage && <p className={styles.fileStatus}>{readingPage}</p>}
          {book && (
            <p className={styles.fileStatus}>
              {book.pageCount} pages · text found
            </p>
          )}
        </div>
      ) : (
        <div className={styles.field}>
          <label htmlFor={`${id}-address`} className={styles.label}>
            Blog address
          </label>
          <Input
            id={`${id}-address`}
            type="url"
            placeholder="https://"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <p className={styles.hint}>
            Posts from this site are added together as one Source, up to 20
            posts.
          </p>
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor={`${id}-title`} className={styles.label}>
          Title
        </label>
        <Input
          id={`${id}-title`}
          required
          maxLength={MAX_TITLE_LENGTH}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${id}-author`} className={styles.label}>
          Author
        </label>
        <Input
          id={`${id}-author`}
          required
          maxLength={MAX_TITLE_LENGTH}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
        />
      </div>

      {kind === "book" && canShare && (
        <label className={styles.shareOption}>
          <input
            type="checkbox"
            checked={shared}
            onChange={(event) => setShared(event.target.checked)}
          />
          Shared with every reader (the demo book)
        </label>
      )}

      {kind === "book" && (
        <p className={styles.note}>
          <LockIcon className={styles.noteIcon} aria-hidden />
          The text is read in your browser. The PDF itself is never uploaded.
          Keep this tab open until the book is Ready.
        </p>
      )}

      {rejection && (
        <p role="alert" className={styles.rejection}>
          {rejectionMessages[rejection]}
        </p>
      )}

      {sending && (
        <div className={styles.sending}>
          <div
            className={styles.sendingTrack}
            role="progressbar"
            aria-label="Adding the book"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={sending.donePercent}
          >
            <div
              className={styles.sendingDone}
              style={{ width: `${sending.donePercent}%` }}
            />
            <div
              className={styles.sendingInFlight}
              style={{ width: `${sending.inFlightPercent}%` }}
            />
          </div>
          <p className={styles.sendingStep} aria-live="polite">
            <LoaderCircleIcon className={styles.sendingIcon} aria-hidden />
            {sending.step}
          </p>
          <p className={styles.sendingHint}>
            Usually 1–2 minutes for a 300-page book.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button
          type="submit"
          disabled={
            !isNewSourceValid(source) || isPending || readingPage !== null
          }
        >
          {isPending ? "Adding…" : "Add Source"}
        </Button>
      </DialogFooter>
    </form>
  );
};

type AddSourceButtonProps = {
  children: ReactNode;
  initialKind?: SourceKind;
  canShare?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  disabled?: boolean;
};

// A button that opens the Add Source dialog.
export const AddSourceButton = ({
  children,
  initialKind = "book",
  canShare = false,
  variant = "default",
  size = "default",
  disabled = false,
}: AddSourceButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // While a book is sent, the dialog stays open
  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen && isSending) {
      return;
    }

    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={<Button variant={variant} size={size} disabled={disabled} />}
      >
        {children}
      </DialogTrigger>
      <DialogContent className={styles.content} showCloseButton={!isSending}>
        <DialogHeader>
          <DialogTitle>Add a Source</DialogTitle>
          <DialogDescription>
            You can have up to 3 active Sources. Each one is deleted 7 days
            after you add it.
          </DialogDescription>
        </DialogHeader>
        <AddSourceForm
          initialKind={initialKind}
          canShare={canShare}
          onDone={() => setOpen(false)}
          onSendingChange={setIsSending}
        />
      </DialogContent>
    </Dialog>
  );
};
