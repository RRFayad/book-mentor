import type {
  Citation,
  Conversation,
  ConversationSource,
  RichText,
  Source,
} from "@/lib/backend/types";

// Mock data for the frontend phase (issue #14). Every book and blog text is a
// bracketed placeholder; never put invented quotes from real authors here.

export const mockScenarios = [
  "default",
  "empty-library",
  "limit-reached",
] as const;

export type MockScenario = (typeof mockScenarios)[number];

// One message the user sent, as the message limit sees it.
export type SentMessage = {
  sentAt: string;
  answerFailed: boolean;
};

export type MockData = {
  sources: Source[];
  conversations: Conversation[];
  sentMessages: SentMessage[];
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
export const SOURCE_LIFETIME = 7 * DAY;

const at = (now: Date, msAgo: number): string =>
  new Date(now.getTime() - msAgo).toISOString();

// Builds RichText: strings become text, numbers become Citation markers.
const rich = (...items: (string | number)[]): RichText =>
  items.map((item) =>
    typeof item === "number"
      ? { type: "citation", number: item }
      : { type: "text", text: item },
  );

const sourceDates = (now: Date, addedMsAgo: number) => ({
  addedAt: at(now, addedMsAgo),
  expiresAt: at(now, addedMsAgo - SOURCE_LIFETIME),
});

const heavyDuty = (now: Date): Source => ({
  id: "src-heavy-duty",
  kind: "book",
  title: "Heavy Duty",
  author: "Mike Mentzer",
  pageCount: 212,
  state: "ready",
  ...sourceDates(now, 1 * DAY),
});

const bayeBlog = (now: Date): Source => ({
  id: "src-baye-blog",
  kind: "blog",
  title: "Drew Baye's blog",
  author: "Drew Baye",
  postCount: 20,
  address: "https://www.baye.com/",
  state: "ready",
  ...sourceDates(now, 6 * DAY),
});

const hitMentzerWay = (now: Date): Source => ({
  id: "src-hit-mentzer-way",
  kind: "book",
  title: "High-Intensity Training the Mike Mentzer Way",
  author: "Mike Mentzer",
  pageCount: 348,
  state: "ingesting",
  ingestionProgress: 44,
  ...sourceDates(now, 10 * 60 * 1000),
});

const heavyDutyRef: ConversationSource = {
  id: "src-heavy-duty",
  kind: "book",
  title: "Heavy Duty",
  author: "Mike Mentzer",
  expired: false,
};

const bayeBlogRef: ConversationSource = {
  id: "src-baye-blog",
  kind: "blog",
  title: "Drew Baye's blog",
  author: "Drew Baye",
  expired: false,
};

// Expired Sources are no longer in the Library; only Conversations list them.
const heavyDutyJournalRef: ConversationSource = {
  id: "src-heavy-duty-journal",
  kind: "book",
  title: "Heavy Duty Journal",
  author: "Mike Mentzer",
  expired: true,
};

const heavyDutyTwoRef: ConversationSource = {
  id: "src-heavy-duty-2",
  kind: "book",
  title: "Heavy Duty II",
  author: "Mike Mentzer",
  expired: true,
};

const bookCitation = (
  number: number,
  source: ConversationSource,
  page: number,
): Citation => ({
  number,
  sourceId: source.id,
  sourceTitle: source.title,
  author: source.author,
  location: { kind: "page", page },
  quotedText: `[Cited passage from page ${page} of ${source.title}]`,
});

const blogCitation = (number: number, postNumber: number): Citation => ({
  number,
  sourceId: bayeBlogRef.id,
  sourceTitle: bayeBlogRef.title,
  author: bayeBlogRef.author,
  location: {
    kind: "post",
    postTitle: `[Post title ${postNumber}]`,
    url: "https://www.baye.com/",
  },
  quotedText: `[Cited passage from post ${postNumber} of Drew Baye's blog]`,
});

const volumeConversation = (now: Date): Conversation => ({
  id: "conv-volume",
  title: "Where does Mentzer's view on volume conflict with Baye's?",
  lastActivityAt: at(now, 2 * HOUR),
  sources: [heavyDutyRef, bayeBlogRef],
  messages: [
    {
      id: "msg-volume-1",
      role: "user",
      text: "Where does Mentzer's view on training volume conflict with Drew Baye's?",
    },
    {
      id: "msg-volume-2",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "positions",
          positions: [
            {
              sourceId: heavyDutyRef.id,
              content: rich(
                "Argues for one all-out set per exercise and long recovery between workouts",
                1,
                2,
                ".",
              ),
            },
            {
              sourceId: bayeBlogRef.id,
              content: rich(
                "Also favours brief workouts taken to momentary muscular failure, with more than one exercise per muscle in some routines",
                3,
                ".",
              ),
            },
          ],
        },
        {
          type: "section",
          section: "agreements",
          content: rich(
            "Both treat intensity as the main driver of results and see extra sets as recovery cost",
            1,
            3,
            ".",
          ),
        },
        {
          type: "section",
          section: "conflicts",
          content: rich(
            "They differ on how far to cut volume: Mentzer goes further, down to a single set, while the cited posts allow more work per muscle group",
            2,
            4,
            ".",
          ),
        },
        {
          type: "not-addressed",
          sourceId: bayeBlogRef.id,
          content: rich(
            "None of the posts discusses Mentzer's idea of recording every workout to judge progress. That is silence, not disagreement.",
          ),
        },
      ],
      citations: [
        bookCitation(1, heavyDutyRef, 42),
        bookCitation(2, heavyDutyRef, 57),
        blogCitation(3, 1),
        blogCitation(4, 2),
      ],
    },
  ],
});

const failureConversation = (now: Date): Conversation => ({
  id: "conv-failure",
  title: "What does Mentzer mean by training to failure?",
  lastActivityAt: at(now, 5 * HOUR),
  sources: [heavyDutyRef, bayeBlogRef],
  messages: [
    {
      id: "msg-failure-1",
      role: "user",
      text: "What does Mentzer mean by training to failure, and why does it matter?",
    },
    {
      id: "msg-failure-2",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "section",
          section: "source-says",
          content: rich(
            "Mentzer argues that a set should continue until another full repetition is impossible in good form",
            1,
            ". He treats that point of momentary muscular failure as the stimulus for growth, and sets beyond it as a cost to recover from rather than a benefit",
            2,
            ".",
          ),
        },
        {
          type: "section",
          section: "meaning",
          content: rich(
            "In his framework, intensity is the variable you control, not the number of sets. If the last repetitions are what trigger adaptation, extra volume mostly adds fatigue.",
          ),
        },
        {
          type: "section",
          section: "application",
          content: rich(
            "How many of your current sets actually reach the point Mentzer describes? Which of them could you replace with a single set taken all the way?",
          ),
        },
      ],
      citations: [
        bookCitation(1, heavyDutyRef, 42),
        bookCitation(2, heavyDutyRef, 43),
      ],
    },
  ],
});

const restConversation = (now: Date): Conversation => ({
  id: "conv-rest",
  title: "Rest between workouts in Baye's posts",
  lastActivityAt: at(now, 3 * DAY),
  sources: [bayeBlogRef],
  messages: [
    {
      id: "msg-rest-1",
      role: "user",
      text: "Which of Baye's posts talk about rest between workouts?",
    },
    {
      id: "msg-rest-2",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "section",
          section: "source-says",
          content: rich(
            "Two posts discuss rest between workouts directly: [Post title 1]",
            1,
            " and [Post title 2]",
            2,
            ". Both tie the length of rest to how intense the previous workout was.",
          ),
        },
      ],
      citations: [blogCitation(1, 1), blogCitation(2, 2)],
    },
    {
      id: "msg-rest-3",
      role: "user",
      text: "What do they say about marathon training?",
    },
    {
      id: "msg-rest-4",
      role: "mentor",
      status: "complete",
      parts: [{ type: "not-covered" }],
      citations: [],
    },
    {
      id: "msg-rest-5",
      role: "user",
      text: "How long should I rest after a hard leg workout?",
    },
    {
      id: "msg-rest-6",
      role: "mentor",
      status: "error",
      parts: [],
      citations: [],
    },
    {
      id: "msg-rest-7",
      role: "user",
      text: "How long should I rest after a hard leg workout?",
    },
    {
      id: "msg-rest-8",
      role: "mentor",
      status: "stopped",
      parts: [
        {
          type: "section",
          section: "source-says",
          content: rich(
            "Baye describes recovery as something that has to be earned back after each hard workout",
            1,
            ", and recommends",
          ),
        },
      ],
      citations: [blogCitation(1, 3)],
    },
  ],
});

const restDaysConversation = (now: Date): Conversation => ({
  id: "conv-rest-days",
  title: "What Mentzer says about rest days",
  lastActivityAt: at(now, 5 * DAY),
  sources: [heavyDutyJournalRef, bayeBlogRef],
  messages: [
    {
      id: "msg-rest-days-1",
      role: "user",
      text: "What does Mentzer say about rest days?",
    },
    {
      id: "msg-rest-days-2",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "text",
          content: rich(
            "Heavy Duty Journal is no longer available. It expired and was deleted. Nothing from it about rest days has been cited in this Conversation yet, so I can only answer this from Drew Baye's blog.",
          ),
        },
      ],
      citations: [],
    },
  ],
});

const splitConversation = (now: Date): Conversation => ({
  id: "conv-split",
  title: "How Mentzer structures a split routine",
  lastActivityAt: at(now, 20 * DAY),
  sources: [heavyDutyTwoRef],
  messages: [
    {
      id: "msg-split-1",
      role: "user",
      text: "How does Mentzer structure a split routine?",
    },
    {
      id: "msg-split-2",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "section",
          section: "source-says",
          content: rich(
            "Mentzer splits the body across separate workouts so each one stays brief enough to be performed at full intensity",
            1,
            ".",
          ),
        },
      ],
      citations: [bookCitation(1, heavyDutyTwoRef, 88)],
    },
    {
      id: "msg-split-3",
      role: "user",
      text: "So why does keeping each workout brief matter so much to him?",
    },
    {
      id: "msg-split-4",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "section",
          section: "source-says",
          content: rich(
            "In the passage cited earlier, brevity is what makes full intensity possible: a longer workout can't be performed all-out from start to finish",
            1,
            ".",
          ),
        },
        {
          type: "section",
          section: "meaning",
          content: rich(
            "For Mentzer, the split is a means rather than a goal. It exists to protect intensity, which is the variable he cares about.",
          ),
        },
      ],
      citations: [bookCitation(1, heavyDutyTwoRef, 88)],
    },
    {
      id: "msg-split-5",
      role: "user",
      text: "What does he say about training frequency for beginners?",
    },
    {
      id: "msg-split-6",
      role: "mentor",
      status: "complete",
      parts: [
        {
          type: "text",
          content: rich(
            "Heavy Duty II has expired, and this hasn't come up in our Conversation, so I can't answer it from the book anymore.",
          ),
        },
      ],
      citations: [],
    },
  ],
});

// `count` messages, evenly spread from `oldestMsAgo` up to now.
const sentMessages = (
  now: Date,
  count: number,
  oldestMsAgo: number,
): SentMessage[] =>
  Array.from({ length: count }, (_, index) => ({
    sentAt: at(now, oldestMsAgo - (index * oldestMsAgo) / count),
    answerFailed: false,
  }));

export const createMockData = (scenario: MockScenario, now: Date): MockData => {
  if (scenario === "empty-library") {
    return { sources: [], conversations: [], sentMessages: [] };
  }

  return {
    sources: [heavyDuty(now), bayeBlog(now), hitMentzerWay(now)],
    conversations: [
      volumeConversation(now),
      failureConversation(now),
      restConversation(now),
      restDaysConversation(now),
      splitConversation(now),
    ],
    sentMessages:
      scenario === "limit-reached"
        ? sentMessages(now, 50, 23 * HOUR)
        : sentMessages(now, 14, 7 * HOUR),
  };
};
