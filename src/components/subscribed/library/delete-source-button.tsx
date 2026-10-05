"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteSourceAction } from "@/actions/sources";
import { showToast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteImpactText } from "@/lib/sources/delete-impact";
import { tw } from "@/lib/utils";

const styles = {
  content: tw("sm:max-w-md"),
  body: tw("space-y-2 text-sm"),
  muted: tw("text-muted-foreground"),
};

type DeleteSourceButtonProps = {
  sourceId: string;
  title: string;
  conversationCount: number;
};

export const DeleteSourceButton = ({
  sourceId,
  title,
  conversationCount,
}: DeleteSourceButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const impact = deleteImpactText(conversationCount);

  const confirm = () => {
    startTransition(async () => {
      const { ok } = await deleteSourceAction(sourceId);

      setOpen(false);

      if (!ok) {
        showToast({
          type: "error",
          title: `Couldn't delete ${title}.`,
          message: "Try again.",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${title}`}
          />
        }
      >
        <Trash2Icon />
      </DialogTrigger>
      <DialogContent className={styles.content} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete {title}?</DialogTitle>
          <DialogDescription render={<div className={styles.body} />}>
            {impact && <p>{impact}</p>}
            <p className={styles.muted}>This can&apos;t be undone.</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={confirm}>
            {isPending ? "Deleting…" : "Delete Source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
