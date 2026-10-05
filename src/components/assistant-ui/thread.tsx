"use client";

import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import type { DataMessagePartComponent } from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CopyIcon,
  SquareIcon,
} from "lucide-react";
import { useState, type FC, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { tw } from "@/lib/utils";

// The Conversation thread, built on assistant-ui primitives and adapted from
// its registry thread (ADR 0004). The app supplies how a Mentor answer renders
// and what sits above and below the composer.

const styles = {
  root: tw("flex h-full flex-col bg-background"),
  viewport: tw("flex flex-1 flex-col overflow-y-auto scroll-smooth"),
  column: tw("mx-auto flex w-full max-w-176 flex-1 flex-col px-4 pt-8"),
  messages: tw("mb-10 flex flex-col gap-y-6"),
  userMessage: tw("flex justify-end px-2"),
  userBubble: tw(
    "max-w-[80%] rounded-2xl bg-muted px-4 py-2 leading-relaxed wrap-break-word",
  ),
  mentorMessage: tw("flex flex-col gap-1"),
  mentorContent: tw("px-2 leading-relaxed wrap-break-word"),
  actionBar: tw("flex gap-1 px-1 text-muted-foreground"),
  footer: tw(
    "sticky bottom-0 mt-auto flex flex-col gap-2 bg-background pb-4 md:pb-6",
  ),
  scrollToBottom: tw(
    "absolute -top-12 self-center rounded-full disabled:invisible",
  ),
  composer: tw(
    "flex w-full flex-col gap-2 rounded-2xl border border-foreground/10 bg-muted/30 p-2 transition-colors focus-within:border-foreground/25 has-disabled:opacity-60",
  ),
  input: tw(
    "max-h-48 min-h-10 w-full resize-none bg-transparent px-2.5 py-1 text-base leading-6 outline-none placeholder:text-muted-foreground/70",
  ),
  composerActions: tw("flex items-center justify-between gap-3 ps-2.5"),
  sendButton: tw("rounded-full"),
  stopIcon: tw("fill-current"),
};

type ThreadProps = {
  // Renders the custom "answer" part of a Mentor message.
  AnswerPart: DataMessagePartComponent;
  // Shown inside the composer, above the input (the Conversation's Sources).
  composerHeader?: ReactNode;
  // Shown inside the composer, left of the send button.
  composerNote?: ReactNode;
  // Shown under the composer (the message allowance).
  composerFooter?: ReactNode;
  placeholder?: string;
  // Shown at the top of the thread, above the messages.
  banner?: ReactNode;
};

const CopyButton = () => {
  const text = useAuiState(
    (state) => state.message.metadata.custom?.plainText as string | undefined,
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : "Copy"}
      disabled={!text}
      onClick={copy}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};

const UserMessage: FC = () => (
  <MessagePrimitive.Root className={styles.userMessage}>
    <div className={styles.userBubble}>
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
);

const MentorMessage: FC<Pick<ThreadProps, "AnswerPart">> = ({ AnswerPart }) => {
  const isRunning = useAuiState(
    (state) => state.message.status?.type === "running",
  );

  return (
    <MessagePrimitive.Root className={styles.mentorMessage}>
      <div className={styles.mentorContent}>
        <MessagePrimitive.Parts
          components={{ data: { by_name: { answer: AnswerPart } } }}
        />
      </div>
      {!isRunning && (
        <div className={styles.actionBar}>
          <CopyButton />
        </div>
      )}
    </MessagePrimitive.Root>
  );
};

const ThreadMessage: FC<Pick<ThreadProps, "AnswerPart">> = ({ AnswerPart }) => {
  const role = useAuiState((state) => state.message.role);

  return role === "user" ? (
    <UserMessage />
  ) : (
    <MentorMessage AnswerPart={AnswerPart} />
  );
};

const Composer = ({
  composerHeader,
  composerNote,
  placeholder,
}: Pick<ThreadProps, "composerHeader" | "composerNote" | "placeholder">) => (
  <ComposerPrimitive.Root className={styles.composer}>
    {composerHeader}
    <ComposerPrimitive.Input
      className={styles.input}
      placeholder={placeholder}
      aria-label="Message the Mentor"
      rows={1}
    />
    <div className={styles.composerActions}>
      {composerNote ?? <span />}
      <AuiIf condition={(state) => !state.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <Button
            size="icon-sm"
            className={styles.sendButton}
            aria-label="Send message"
          >
            <ArrowUpIcon />
          </Button>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(state) => state.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            size="icon-sm"
            className={styles.sendButton}
            aria-label="Stop generating"
          >
            <SquareIcon className={styles.stopIcon} />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  </ComposerPrimitive.Root>
);

export const Thread = ({
  AnswerPart,
  composerHeader,
  composerNote,
  composerFooter,
  placeholder = "Reply to the Mentor…",
  banner,
}: ThreadProps) => (
  <ThreadPrimitive.Root className={styles.root}>
    <ThreadPrimitive.Viewport className={styles.viewport}>
      <div className={styles.column}>
        {banner}
        <div className={styles.messages}>
          <ThreadPrimitive.Messages>
            {() => <ThreadMessage AnswerPart={AnswerPart} />}
          </ThreadPrimitive.Messages>
        </div>
        <ThreadPrimitive.ViewportFooter className={styles.footer}>
          <ThreadPrimitive.ScrollToBottom asChild>
            <Button
              variant="outline"
              size="icon"
              className={styles.scrollToBottom}
              aria-label="Scroll to bottom"
            >
              <ArrowDownIcon />
            </Button>
          </ThreadPrimitive.ScrollToBottom>
          <Composer
            composerHeader={composerHeader}
            composerNote={composerNote}
            placeholder={placeholder}
          />
          {composerFooter}
        </ThreadPrimitive.ViewportFooter>
      </div>
    </ThreadPrimitive.Viewport>
  </ThreadPrimitive.Root>
);
