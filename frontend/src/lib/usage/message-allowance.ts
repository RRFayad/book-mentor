const DAY = 24 * 60 * 60 * 1000;

type SentMessage = {
  sentAt: string;
  answerFailed: boolean;
};

export type MessageAllowance = {
  used: number;
  remaining: number;
  // When the next message is allowed; null while messages are left.
  nextAvailableAt: string | null;
};

// The rolling message limit: messages sent in the last 24 hours count, except
// those whose answer failed. A message exactly 24 hours old no longer counts.
export const messageAllowance = (
  sentMessages: SentMessage[],
  now: Date,
  limit: number,
): MessageAllowance => {
  const counted = sentMessages
    .filter(
      (message) =>
        !message.answerFailed &&
        now.getTime() - Date.parse(message.sentAt) < DAY,
    )
    .map((message) => Date.parse(message.sentAt))
    .sort((a, b) => a - b);

  const used = counted.length;
  const remaining = Math.max(0, limit - used);

  // At the limit, sending is possible again once enough of the oldest
  // counted messages leave the 24-hour window.
  const nextAvailableAt =
    remaining === 0
      ? new Date(counted[used - limit] + DAY).toISOString()
      : null;

  return { used, remaining, nextAvailableAt };
};
