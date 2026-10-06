"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { ClockIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sendMessageAction, stopAnswerAction } from "@/actions/messages";
import { getUsageAction } from "@/actions/usage";
import { Thread } from "@/components/assistant-ui/thread";
import { showToast } from "@/components/toaster";
import { Answer } from "@/components/subscribed/conversation/answer";
import { CitationPanel } from "@/components/subscribed/conversation/citation-panel";
import {
  ConversationContext,
  type CitationKey,
} from "@/components/subscribed/conversation/conversation-context";
import { MessageAllowance } from "@/components/subscribed/conversation/message-allowance";
import { SourceChips } from "@/components/subscribed/conversation/source-chips";
import { expiryBannerText } from "@/lib/conversations/expiry-banner";
import type {
  Conversation,
  ConversationSource,
  MentorAnswer,
  MentorAnswerStatus,
  Message,
  SendMessageResult,
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
  layout: tw("flex h-full"),
  thread: tw("min-w-0 flex-1"),
  composerNote: tw("text-xs text-muted-foreground"),
  banner: tw(
    "mb-6 flex gap-3 rounded-xl border bg-muted px-4 py-3 text-sm leading-normal [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  ),
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
  shownWords: number;
  timer: number | null;
  stopRequested: boolean;
};

type ConversationThreadProps = {
  conversation: Conversation;
  initialUsage: Usage;
  // The first question of a new Conversation, sent once when the thread opens.
  pendingQuestion?: string;
};

export const ConversationThread = ({
  conversation,
  initialUsage,
  pendingQuestion,
}: ConversationThreadProps) => {
  const router = useRouter();
  const pathname = usePathname();
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

  // On unmount, stop the timer only. Keeping the stream itself lets React's
  // extra effect run in development (Strict Mode) leave a pending send intact.
  useEffect(
    () => () => {
      const timer = streamRef.current?.timer;

      if (timer) {
        window.clearInterval(timer);
      }
    },
    [],
  );

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
    await stopAnswerAction(conversationId, stopped.id, stream.shownWords);
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
        stream.shownWords = shownWords;
        showAnswer(stream.shown);
      }, TICK_MS);

      if (stream.stopRequested) {
        void stopStream();
      }
    },
    [finishStream, showAnswer, stopStream],
  );

  const sendText = useCallback(
    async (text: string) => {
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

      streamRef.current = {
        shown: waiting,
        shownWords: 0,
        timer: null,
        stopRequested: false,
      };
      setMessages((current) => [
        ...current,
        { id: userMessageId, role: "user", text },
        waiting,
      ]);

      let result: SendMessageResult;

      try {
        result = await sendMessageAction({
          conversationId,
          userMessageId,
          answerId,
          text,
        });
      } catch {
        // A network or server error: treat it like a failed send.
        result = { status: "failed" };
      }

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

  const onNew = useCallback(
    (message: AppendMessage) => sendText(messageText(message)),
    [sendText],
  );

  // A new Conversation arrives with its first question: send it once, then
  // drop it from the address so a reload does not send it again.
  const pendingSentRef = useRef(false);

  useEffect(() => {
    if (!pendingQuestion || pendingSentRef.current || messages.length > 0) {
      return;
    }

    pendingSentRef.current = true;
    router.replace(pathname);
    void sendText(pendingQuestion);
  }, [messages.length, pathname, pendingQuestion, router, sendText]);

  // At the limit, read the usage again once the next message is allowed, so
  // the composer opens without a reload.
  useEffect(() => {
    if (!usage.nextMessageAvailableAt) {
      return;
    }

    const wait = Date.parse(usage.nextMessageAvailableAt) - Date.now();
    const timer = window.setTimeout(
      async () => {
        const fresh = await getUsageAction();

        if (fresh) {
          setUsage(fresh);
        }
      },
      Math.max(0, wait) + 1000,
    );

    return () => window.clearTimeout(timer);
  }, [usage.nextMessageAvailableAt]);

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

  const selectedAnswer = messages.find(
    (message): message is MentorAnswer =>
      message.role === "mentor" && message.id === selectedCitation?.answerId,
  );
  const citation =
    selectedAnswer?.citations.find(
      (item) => item.number === selectedCitation?.number,
    ) ?? null;

  const expiry = expiryBannerText(sources);

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
      <div className={styles.layout}>
        <div className={styles.thread}>
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
              banner={
                expiry && (
                  <p role="status" className={styles.banner}>
                    <ClockIcon aria-hidden />
                    <span>
                      <strong>{expiry.title}</strong> {expiry.text}
                    </span>
                  </p>
                )
              }
            />
          </AssistantRuntimeProvider>
        </div>
        <CitationPanel
          citation={citation}
          onClose={() => setSelectedCitation(null)}
        />
      </div>
    </ConversationContext>
  );
};
