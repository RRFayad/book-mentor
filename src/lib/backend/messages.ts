import "server-only";

import { getMockStore } from "@/lib/backend/mock/store";
import type {
  ConversationSource,
  MentorAnswer,
  NewMessage,
  SendMessageResult,
} from "@/lib/backend/types";
import { getUsage, MESSAGE_LIMIT } from "@/lib/backend/usage";
import { messageAllowance } from "@/lib/usage/message-allowance";

// A canned answer for the frontend phase. The real Mentor replaces it.
const mockAnswer = (
  answerId: string,
  sources: ConversationSource[],
): MentorAnswer => {
  const source = sources.find((item) => !item.expired);

  if (!source) {
    const single = sources.length === 1 ? sources[0] : null;
    const names = single ? single.title : "This Conversation's Sources";
    const from = single ? `the ${single.kind}` : "them";

    return {
      id: answerId,
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "text",
          content: [
            {
              type: "text",
              text: `${names} ${single ? "has" : "have"} expired, and this hasn't come up in our Conversation, so I can't answer it from ${from} anymore.`,
            },
          ],
        },
      ],
      citations: [],
    };
  }

  return {
    id: answerId,
    role: "mentor",
    status: "complete",
    parts: [
      {
        type: "section",
        section: "source-says",
        content: [
          {
            type: "text",
            text: `This is a mock answer for the frontend phase. It points to a passage from ${source.title}`,
          },
          { type: "citation", number: 1 },
          {
            type: "text",
            text: ", so the streaming, the sections, and the Citations can be checked before the real Mentor exists.",
          },
        ],
      },
      {
        type: "section",
        section: "meaning",
        content: [
          {
            type: "text",
            text: "The real Mentor will write this section from your Sources, and only from them.",
          },
        ],
      },
    ],
    citations: [
      {
        number: 1,
        sourceId: source.id,
        sourceTitle: source.title,
        author: source.author,
        location:
          source.kind === "book"
            ? { kind: "page", page: 12 }
            : {
                kind: "post",
                postTitle: "[Post title]",
                url: "https://www.baye.com/",
              },
        quotedText: `[Cited passage from ${source.title}]`,
      },
    ],
  };
};

// Saves the question and the full answer. The client then shows the answer a
// few words at a time. A message containing "fail" gets a failed answer, which
// does not count toward the message limit.
export const sendMessage = async (
  message: NewMessage,
): Promise<SendMessageResult> => {
  const store = getMockStore();
  const now = new Date();
  const conversation = store.conversations.find(
    (item) => item.id === message.conversationId,
  );

  if (
    !conversation ||
    messageAllowance(store.sentMessages, now, MESSAGE_LIMIT).remaining === 0
  ) {
    return { status: "limit-reached", usage: await getUsage() };
  }

  const failed = message.text.toLowerCase().includes("fail");
  const answer: MentorAnswer = failed
    ? {
        id: message.answerId,
        role: "mentor",
        status: "error",
        parts: [],
        citations: [],
      }
    : mockAnswer(message.answerId, conversation.sources);

  conversation.messages.push(
    { id: message.userMessageId, role: "user", text: message.text },
    answer,
  );
  conversation.lastActivityAt = now.toISOString();
  store.sentMessages.push({
    sentAt: now.toISOString(),
    answerFailed: failed,
  });

  return {
    status: "answered",
    answer: structuredClone(answer),
    usage: await getUsage(),
  };
};

// The user stopped the answer: keep what was shown, marked as stopped.
export const stopAnswer = async (
  conversationId: string,
  shownAnswer: MentorAnswer,
): Promise<void> => {
  const conversation = getMockStore().conversations.find(
    (item) => item.id === conversationId,
  );
  const index = conversation?.messages.findIndex(
    (item) => item.id === shownAnswer.id,
  );

  if (conversation && index !== undefined && index !== -1) {
    conversation.messages[index] = { ...shownAnswer, status: "stopped" };
  }
};
