"use client";

import { BookOpenIcon, GlobeIcon, LockIcon } from "lucide-react";
import { useId, useState, useTransition, type ReactNode } from "react";

import { addSourceAction, sendPageBatchAction } from "@/actions/sources";
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
import { isScanned, toPageBatches } from "@/lib/sources/pdf-pages";
import { readPdf, type PdfBook } from "@/lib/sources/read-pdf";
import { cn, tw } from "@/lib/utils";

const styles = {
  content: tw("sm:max-w-lg"),
  tabs: tw("grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"),
  tab: tw(
    "flex h-8 items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors [&_svg]:size-4",
  ),
  tabActive: tw("bg-background text-foreground shadow-sm"),
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

type AddSourceFormProps = {
  initialKind: SourceKind;
  onDone: () => void;
};

const AddSourceForm = ({ initialKind, onDone }: AddSourceFormProps) => {
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
  const [sending, setSending] = useState<string | null>(null);

  const source: NewSource =
    kind === "book"
      ? { kind, fileName, pageCount: book?.pageCount ?? 0, title, author }
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

  // Sends the book's pages to the backend, a batch at a time (ADR 0001).
  const sendPages = async (sourceId: string, pages: PdfBook["pages"]) => {
    const batches = toPageBatches(pages);

    for (const [index, batch] of batches.entries()) {
      setSending(`Sending pages… ${index + 1} of ${batches.length}`);

      const { ok } = await sendPageBatchAction(sourceId, batch);

      if (!ok) {
        return false;
      }
    }

    return true;
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
        <button
          type="button"
          role="tab"
          aria-selected={kind === "blog"}
          className={cn(styles.tab, kind === "blog" && styles.tabActive)}
          onClick={() => chooseKind("blog")}
        >
          <GlobeIcon aria-hidden />
          Blog
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
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
        />
      </div>

      {kind === "book" && (
        <p className={styles.note}>
          <LockIcon className={styles.noteIcon} aria-hidden />
          The text is read in your browser. The PDF itself is never uploaded.
        </p>
      )}

      {rejection && (
        <p role="alert" className={styles.rejection}>
          {rejectionMessages[rejection]}
        </p>
      )}

      <DialogFooter>
        <Button
          type="submit"
          disabled={
            !isNewSourceValid(source) || isPending || readingPage !== null
          }
        >
          {sending ?? (isPending ? "Adding…" : "Add Source")}
        </Button>
      </DialogFooter>
    </form>
  );
};

type AddSourceButtonProps = {
  children: ReactNode;
  initialKind?: SourceKind;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  disabled?: boolean;
};

// A button that opens the Add Source dialog.
export const AddSourceButton = ({
  children,
  initialKind = "book",
  variant = "default",
  size = "default",
  disabled = false,
}: AddSourceButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={variant} size={size} disabled={disabled} />}
      >
        {children}
      </DialogTrigger>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Add a Source</DialogTitle>
          <DialogDescription>
            You can have up to 3 active Sources. Each one is deleted 7 days
            after you add it.
          </DialogDescription>
        </DialogHeader>
        <AddSourceForm
          initialKind={initialKind}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
