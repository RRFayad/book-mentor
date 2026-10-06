// The frontend's data contract. Names follow CONTEXT.md. Times are ISO 8601
// strings because that is what the FastAPI JSON responses will carry.
// The answer part types are provisional: the engineering grill may change them.

export type SourceKind = "book" | "blog";

type BookDetails = {
  kind: "book";
  pageCount: number;
};

type BlogDetails = {
  kind: "blog";
  postCount: number;
  address: string;
};

type IngestionStatus =
  { state: "ingesting"; ingestionProgress: number } | { state: "ready" };

export type Source = {
  id: string;
  title: string;
  author: string;
  addedAt: string;
  expiresAt: string;
} & (BookDetails | BlogDetails) &
  IngestionStatus;

// What the user enters to add a Source. The browser does not read the PDF yet,
// so a book is only its file name for now.
export type NewSource =
  | { kind: "book"; fileName: string; title: string; author: string }
  | { kind: "blog"; address: string; title: string; author: string };

export type AddSourceResult =
  | { status: "added"; source: Source }
  | { status: "rejected"; reason: "scanned" | "too-large" }
  | { status: "failed" }
  | { status: "limit-reached" };

// The client chooses the ids, so it can show the messages before the reply.
export type NewMessage = {
  conversationId: string;
  userMessageId: string;
  answerId: string;
  text: string;
};

export type SendMessageResult =
  | { status: "answered"; answer: MentorAnswer; usage: Usage }
  | { status: "limit-reached"; usage: Usage }
  | { status: "failed" };

export type ConversationSummary = {
  id: string;
  title: string;
  lastActivityAt: string;
};

// A Source as a Conversation sees it. It stays listed after its Expiry.
export type ConversationSource = {
  id: string;
  kind: SourceKind;
  title: string;
  author: string;
  expired: boolean;
};

export type Conversation = ConversationSummary & {
  sources: ConversationSource[];
  messages: Message[];
};

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
};

export type MentorAnswerStatus = "streaming" | "complete" | "stopped" | "error";

export type MentorAnswer = {
  id: string;
  role: "mentor";
  status: MentorAnswerStatus;
  parts: AnswerPart[];
  citations: Citation[];
};

export type Message = UserMessage | MentorAnswer;

// Text with inline Citation markers. A marker refers to a Citation number in
// the same answer.
export type RichText = (
  { type: "text"; text: string } | { type: "citation"; number: number }
)[];

export type AnswerSection =
  "source-says" | "meaning" | "application" | "agreements" | "conflicts";

export type AnswerPart =
  | { type: "section"; section: AnswerSection; content: RichText }
  | {
      type: "positions";
      positions: { sourceId: string; content: RichText }[];
    }
  | { type: "not-addressed"; sourceId: string; content: RichText }
  | { type: "not-covered" }
  | { type: "text"; content: RichText };

export type CitationLocation =
  | { kind: "page"; page: number }
  | { kind: "post"; postTitle: string; url: string };

// Citations are numbered from 1 inside each answer. The quoted text is saved
// with the answer, so it stays readable after the Source's Expiry (ADR 0003).
export type Citation = {
  number: number;
  sourceId: string;
  sourceTitle: string;
  author: string;
  location: CitationLocation;
  quotedText: string;
};

export type Usage = {
  activeSources: number;
  sourceLimit: number;
  messagesInWindow: number;
  messageLimit: number;
  nextMessageAvailableAt: string | null;
};
