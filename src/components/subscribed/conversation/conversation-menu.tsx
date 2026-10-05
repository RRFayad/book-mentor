"use client";

import { Menu } from "@base-ui/react/menu";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useId, useState, useTransition } from "react";

import {
  deleteConversationAction,
  renameConversationAction,
} from "@/actions/conversations";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SidebarMenuAction } from "@/components/ui/sidebar";
import { tw } from "@/lib/utils";

const styles = {
  popup: tw(
    "z-50 min-w-36 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none",
  ),
  item: tw(
    "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:size-4",
  ),
  dangerItem: tw("text-destructive"),
  content: tw("sm:max-w-md"),
  form: tw("space-y-4"),
  label: tw("sr-only"),
};

type ConversationMenuProps = {
  conversationId: string;
  title: string;
  isCurrent: boolean;
};

// The "…" menu on a sidebar Conversation: Rename and Delete.
export const ConversationMenu = ({
  conversationId,
  title,
  isCurrent,
}: ConversationMenuProps) => {
  const inputId = useId();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isPending, startTransition] = useTransition();

  const rename = (event: React.FormEvent) => {
    event.preventDefault();

    if (draft.trim().length === 0) {
      return;
    }

    startTransition(async () => {
      const { ok } = await renameConversationAction(conversationId, draft);

      setRenameOpen(false);

      if (!ok) {
        showToast({
          type: "error",
          title: "Couldn't rename the Conversation.",
          message: "Try again.",
        });
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const { ok } = await deleteConversationAction(conversationId, isCurrent);

      setDeleteOpen(false);

      if (!ok) {
        showToast({
          type: "error",
          title: "Couldn't delete the Conversation.",
          message: "Try again.",
        });
      }
    });
  };

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label={`Actions for ${title}`}
            />
          }
        >
          <MoreHorizontalIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="right" align="start" sideOffset={4}>
            <Menu.Popup className={styles.popup}>
              <Menu.Item
                className={styles.item}
                onClick={() => {
                  setDraft(title);
                  setRenameOpen(true);
                }}
              >
                <PencilIcon aria-hidden />
                Rename
              </Menu.Item>
              <Menu.Item
                className={`${styles.item} ${styles.dangerItem}`}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2Icon aria-hidden />
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className={styles.content}>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <form onSubmit={rename} className={styles.form}>
            <label htmlFor={inputId} className={styles.label}>
              Title
            </label>
            <Input
              id={inputId}
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
            />
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={draft.trim().length === 0 || isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className={styles.content} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete this Conversation?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" disabled={isPending} onClick={remove}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
