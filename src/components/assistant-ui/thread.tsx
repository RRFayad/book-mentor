"use client";

import {
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import type { DataMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, type FC } from "react";

import { Button } from "@/components/ui/button";
import { tw } from "@/lib/utils";

// The Conversation thread, built on assistant-ui primitives and adapted from
// its registry thread (ADR 0004). The app supplies how a Mentor answer renders.

const styles = {
  root: tw("flex h-full flex-col bg-background"),
  viewport: tw("flex flex-1 flex-col overflow-y-auto scroll-smooth"),
  column: tw("mx-auto flex w-full max-w-176 flex-1 flex-col px-4 pt-8 pb-14"),
  messages: tw("flex flex-col gap-y-6"),
  userMessage: tw("flex justify-end px-2"),
  userBubble: tw(
    "max-w-[80%] rounded-2xl bg-muted px-4 py-2 leading-relaxed wrap-break-word",
  ),
  mentorMessage: tw("flex flex-col gap-1"),
  mentorContent: tw("px-2 leading-relaxed wrap-break-word"),
  actionBar: tw("flex gap-1 px-1 text-muted-foreground"),
};

type ThreadProps = {
  // Renders the custom "answer" part of a Mentor message.
  AnswerPart: DataMessagePartComponent;
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

const MentorMessage: FC<ThreadProps> = ({ AnswerPart }) => (
  <MessagePrimitive.Root className={styles.mentorMessage}>
    <div className={styles.mentorContent}>
      <MessagePrimitive.Parts
        components={{ data: { by_name: { answer: AnswerPart } } }}
      />
    </div>
    <div className={styles.actionBar}>
      <CopyButton />
    </div>
  </MessagePrimitive.Root>
);

const ThreadMessage: FC<ThreadProps> = ({ AnswerPart }) => {
  const role = useAuiState((state) => state.message.role);

  return role === "user" ? (
    <UserMessage />
  ) : (
    <MentorMessage AnswerPart={AnswerPart} />
  );
};

export const Thread = ({ AnswerPart }: ThreadProps) => (
  <ThreadPrimitive.Root className={styles.root}>
    <ThreadPrimitive.Viewport className={styles.viewport}>
      <div className={styles.column}>
        <div className={styles.messages}>
          <ThreadPrimitive.Messages>
            {() => <ThreadMessage AnswerPart={AnswerPart} />}
          </ThreadPrimitive.Messages>
        </div>
      </div>
    </ThreadPrimitive.Viewport>
  </ThreadPrimitive.Root>
);
