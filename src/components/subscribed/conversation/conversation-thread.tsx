"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sendMessageAction, stopAnswerAction } from "@/actions/messages";
import { Thread } from "@/components/assistant-ui/thread";
import { showToast } from "@/components/toaster";
import { Answer } from "@/components/subscribed/conversation/answer";
import {
  ConversationContext,
  type CitationKey,
} from "@/components/subscribed/conversation/conversation-context";
import { MessageAllowance } from "@/components/subscribed/conversation/message-allowance";
import { SourceChips } from "@/components/subscribed/conversation/source-chips";
import type {
  Conversation,
  ConversationSource,
  MentorAnswer,
  MentorAnswerStatus,
  Message,
  Usage,
} from "@/lib/backend/types";
import { answerToPlainText } from "@/lib/conversations/answer-text";
import {
  answerWordCount,
  partialAnswer,
} from "@/lib/conversations/partial-answer";
import { tw } from "@/lib/utils";

// Mock streaming: show this many more words of the answer at each tick.
const WORDS_PER_TICK = 3;
const TICK_MS = 50;

const styles = {
  composerNote: tw("text-xs text-muted-foreground"),
};

const answerStatus: Record<MentorAnswerStatus, ThreadMessageLike["status"]> = {
  streaming: { type: "running" },
  complete: { type: "complete", reason: "stop" },
  stopped: { type: "incomplete", reason: "cancelled" },
  error: { type: "incomplete", reason: "error" },
};

// Our Message becomes an assistant-ui message. A Mentor answer travels whole
// as one custom "answer" part; its plain text is kept for the Copy button.
const toThreadMessage = (
  message: Message,
  sources: ConversationSource[],
): ThreadMessageLike =>
  message.role === "user"
    ? {
        id: message.id,
        role: "user",
        content: [{ type: "text", text: message.text }],
      }
    : {
        id: message.id,
        role: "assistant",
        status: answerStatus[message.status],
        content: [{ type: "data-answer", data: message }],
        metadata: {
          custom: { plainText: answerToPlainText(message, sources) },
        },
      };

const messageText = (message: AppendMessage): string =>
  message.content
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n")
    .trim();

// The answer being streamed: what is shown so far, and how to stop it.
type Stream = {
  shown: MentorAnswer;
  timer: number | null;
  stopRequested: boolean;
};

type ConversationThreadProps = {
  conversation: Conversation;
  initialUsage: Usage;
};

export const ConversationThread = ({
  conversation,
  initialUsage,
}: ConversationThreadProps) => {
  const [messages, setMessages] = useState(conversation.messages);
  const [usage, setUsage] = useState(initialUsage);
  const [selectedCitation, setSelectedCitation] = useState<CitationKey | null>(
    null,
  );
  const streamRef = useRef<Stream | null>(null);
  const { id: conversationId, sources } = conversation;

  const showAnswer = useCallback((answer: MentorAnswer) => {
    setMessages((current) =>
      current.map((message) => (message.id === answer.id ? answer : message)),
    );
  }, []);

  const finishStream = useCallback(() => {
    const stream = streamRef.current;

    if (stream?.timer) {
      window.clearInterval(stream.timer);
    }

    streamRef.current = null;
  }, []);

  useEffect(() => finishStream, [finishStream]);

  const stopStream = useCallback(async () => {
    const stream = streamRef.current;

    if (!stream) {
      return;
    }

    if (stream.timer === null) {
      // The reply has not arrived yet; stop as soon as it does.
      stream.stopRequested = true;
      return;
    }

    finishStream();

    const stopped: MentorAnswer = { ...stream.shown, status: "stopped" };

    showAnswer(stopped);
    await stopAnswerAction(conversationId, stopped);
  }, [conversationId, finishStream, showAnswer]);

  const playAnswer = useCallback(
    (answer: MentorAnswer) => {
      const stream = streamRef.current;

      if (!stream) {
        return;
      }

      const totalWords = answerWordCount(answer);
      let shownWords = 0;

      stream.timer = window.setInterval(() => {
        shownWords += WORDS_PER_TICK;

        if (shownWords >= totalWords) {
          finishStream();
          showAnswer(answer);
          return;
        }

        stream.shown = partialAnswer(answer, shownWords);
        showAnswer(stream.shown);
      }, TICK_MS);

      if (stream.stopRequested) {
        void stopStream();
      }
    },
    [finishStream, showAnswer, stopStream],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = messageText(message);

      if (!text || streamRef.current) {
        return;
      }

      const userMessageId = crypto.randomUUID();
      const answerId = crypto.randomUUID();
      const waiting: MentorAnswer = {
        id: answerId,
        role: "mentor",
        status: "streaming",
        parts: [],
        citations: [],
      };

      streamRef.current = { shown: waiting, timer: null, stopRequested: false };
      setMessages((current) => [
        ...current,
        { id: userMessageId, role: "user", text },
        waiting,
      ]);

      const result = await sendMessageAction({
        conversationId,
        userMessageId,
        answerId,
        text,
      });

      if (result.status !== "answered") {
        finishStream();
        setMessages((current) =>
          current.filter(
            (item) => item.id !== userMessageId && item.id !== answerId,
          ),
        );

        if (result.status === "limit-reached") {
          setUsage(result.usage);
        } else {
          showToast({
            type: "error",
            title: "Couldn't send your message.",
            message: "Try again.",
          });
        }

        return;
      }

      setUsage(result.usage);

      if (result.answer.status === "error") {
        finishStream();
        showAnswer(result.answer);
        return;
      }

      playAnswer(result.answer);
    },
    [conversationId, finishStream, playAnswer, showAnswer],
  );

  const convertMessage = useCallback(
    (message: Message) => toThreadMessage(message, sources),
    [sources],
  );

  const lastMessage = messages.at(-1);
  const isRunning =
    lastMessage?.role === "mentor" && lastMessage.status === "streaming";
  const atLimit = usage.messagesInWindow >= usage.messageLimit;

  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage,
    onNew,
    onCancel: stopStream,
    isRunning,
    isDisabled: atLimit && !isRunning,
  });

  const context = useMemo(
    () => ({
      sources,
      selectedCitation,
      selectCitation: setSelectedCitation,
    }),
    [sources, selectedCitation],
  );

  return (
    <ConversationContext value={context}>
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread
          AnswerPart={Answer}
          composerHeader={<SourceChips sources={sources} />}
          composerNote={
            <span className={styles.composerNote}>
              Sources are fixed for this Conversation
            </span>
          }
          composerFooter={<MessageAllowance usage={usage} />}
          placeholder={atLimit ? "Message limit reached" : undefined}
        />
      </AssistantRuntimeProvider>
    </ConversationContext>
  );
};
