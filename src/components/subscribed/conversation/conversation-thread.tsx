"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useCallback, useMemo, useState } from "react";

import { Thread } from "@/components/assistant-ui/thread";
import { Answer } from "@/components/subscribed/conversation/answer";
import {
  ConversationContext,
  type CitationKey,
} from "@/components/subscribed/conversation/conversation-context";
import type {
  Conversation,
  ConversationSource,
  MentorAnswerStatus,
  Message,
} from "@/lib/backend/types";
import { answerToPlainText } from "@/lib/conversations/answer-text";

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

type ConversationThreadProps = {
  conversation: Conversation;
};

export const ConversationThread = ({
  conversation,
}: ConversationThreadProps) => {
  const [messages] = useState(conversation.messages);
  const [selectedCitation, setSelectedCitation] = useState<CitationKey | null>(
    null,
  );
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
        <Thread AnswerPart={Answer} />
      </AssistantRuntimeProvider>
    </ConversationContext>
  );
};
