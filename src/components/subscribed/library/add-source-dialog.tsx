"use client";

import { BookOpenIcon, GlobeIcon, LockIcon } from "lucide-react";
import { useId, useState, useTransition, type ReactNode } from "react";

import { addSourceAction } from "@/actions/sources";
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
  rejection: tw(
    "rounded-lg border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive-text",
  ),
};

const rejectionMessages = {
  scanned:
    "This PDF has no text we can read. It looks like a scan. Only text-based PDFs can be added for now.",
  "too-large": "This PDF has too many pages. Books can have up to 500 pages.",
  "limit-reached": "You have 3 of 3 active Sources. Delete one to add another.",
} as const;

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

  const source: NewSource =
    kind === "book"
      ? { kind, fileName, title, author }
      : { kind, address, title, author };

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
        onDone();
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
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? "");
              setRejection(null);
            }}
          />
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
        <Button type="submit" disabled={!isNewSourceValid(source) || isPending}>
          {isPending ? "Adding…" : "Add Source"}
        </Button>
      </DialogFooter>
    </form>
  );
};

type AddSourceButtonProps = {
  children: ReactNode;
  initialKind?: SourceKind;
  variant?: "default" | "outline";
  disabled?: boolean;
};

// A button that opens the Add Source dialog.
export const AddSourceButton = ({
  children,
  initialKind = "book",
  variant = "default",
  disabled = false,
}: AddSourceButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} disabled={disabled} />}>
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
