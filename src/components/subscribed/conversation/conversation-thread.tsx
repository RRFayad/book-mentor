"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type DataMessagePartProps,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { createContext, useCallback, useContext, useState } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import type {
  Conversation,
  ConversationSource,
  MentorAnswer,
  MentorAnswerStatus,
  Message,
} from "@/lib/backend/types";
import { answerToPlainText } from "@/lib/conversations/answer-text";
import { tw } from "@/lib/utils";

const styles = {
  plainAnswer: tw("whitespace-pre-line"),
};

const answerStatus: Record<MentorAnswerStatus, ThreadMessageLike["status"]> = {
  streaming: { type: "running" },
  complete: { type: "complete", reason: "stop" },
  stopped: { type: "incomplete", reason: "cancelled" },
  error: { type: "incomplete", reason: "error" },
};

// The Conversation's Sources, for answers that name a Source.
const SourcesContext = createContext<ConversationSource[]>([]);

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

const PlainAnswer = ({ data }: DataMessagePartProps<MentorAnswer>) => {
  const sources = useContext(SourcesContext);

  return (
    <p className={styles.plainAnswer}>{answerToPlainText(data, sources)}</p>
  );
};

type ConversationThreadProps = {
  conversation: Conversation;
};

export const ConversationThread = ({
  conversation,
}: ConversationThreadProps) => {
  const [messages] = useState(conversation.messages);
  const { sources } = conversation;

  const convertMessage = useCallback(
    (message: Message) => toThreadMessage(message, sources),
    [sources],
  );
  // Sending messages arrives with the composer.
  const onNew = useCallback(async () => {}, []);

  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage,
    onNew,
  });

  return (
    <SourcesContext value={sources}>
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread AnswerPart={PlainAnswer} />
      </AssistantRuntimeProvider>
    </SourcesContext>
  );
};
