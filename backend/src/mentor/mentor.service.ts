import { ChunkRow, MessageRow, SourceRow } from "@app/shared/db/schema";
import { AnswerPart, Citation, RichText } from "@app/shared/schemas";

import { answerChain, searchQueriesChain } from "./mentor.chains";
import { MAX_SEARCH_QUERIES, retrieveFromSourceId } from "./retrieval.service";

type MentorReply = { parts: AnswerPart[]; citations: Citation[] };

type Passage = Pick<ChunkRow, "sourceId" | "page" | "content"> &
  Pick<SourceRow, "title" | "author">;

//TODO: remove once a message is split into separate questions.
const ONE_QUESTION_AT_A_TIME =
  "Please ask one question at a time, so I can search the book properly for each.";

// Splitting on a capture group keeps the numbers: text, "2", text, "5", text.
const CITATION_MARKER = /\[(\d+)\]/;

const toCitation = (passage: Passage, number: number): Citation => {
  if (passage.page === null) {
    throw new Error("Only book passages can be cited for now");
  }

  return {
    number,
    sourceId: passage.sourceId,
    sourceTitle: passage.title,
    author: passage.author,
    location: { kind: "page", page: passage.page },
    quotedText: passage.content,
  };
};

// The model cites passage numbers; Citations are renumbered 1, 2, 3 in the
// order they first appear, and markers for passages that don't exist are dropped.
const toCitedAnswer = (answer: string, passages: Passage[]): MentorReply => {
  const citedPassages: Passage[] = [];

  const content: RichText = answer
    .split(CITATION_MARKER)
    .flatMap((piece, index): RichText => {
      const isText = index % 2 === 0;

      if (isText) {
        return piece ? [{ type: "text", text: piece }] : [];
      }

      const passage = passages[Number(piece) - 1];

      if (!passage) {
        return [];
      }

      if (!citedPassages.includes(passage)) {
        citedPassages.push(passage);
      }

      return [{ type: "citation", number: citedPassages.indexOf(passage) + 1 }];
    });

  const citations = citedPassages.map((passage, index) =>
    toCitation(passage, index + 1),
  );

  return {
    parts: [{ type: "text", content }],
    citations,
  };
};

// Remove citations from previous messages
const toTextWithoutCitations = (messages: RichText) =>
  messages
    .flatMap((piece) => (piece.type === "text" ? [piece.text] : []))
    .join("");

const answerPartToText = (part: AnswerPart) => {
  switch (part.type) {
    case "section":
    case "text":
    case "not-addressed":
      return toTextWithoutCitations(part.content);
    case "positions":
      return part.positions
        .map((position) => toTextWithoutCitations(position.content))
        .join("\n");
    case "not-covered":
      return "I couldn't find anything about this in the books.";
  }
};

const formatRecentMessages = (recentMessages: MessageRow[]) =>
  recentMessages
    .map((message) => {
      if (message.role === "user") {
        return `Reader: ${message.text}`;
      }

      const answer = (message.parts ?? []).map(answerPartToText).join("\n");

      return `Mentor: ${answer}`;
    })
    .join("\n\n");

export const answerQuestion = async (
  question: string,
  sources: SourceRow[],
  recentMessages: MessageRow[],
): Promise<MentorReply> => {
  const books = sources
    .map((source) => `"${source.title}" by ${source.author}`)
    .join("; ");

  const formattedRecentMessages =
    formatRecentMessages(recentMessages) || "None.";

  // The One Page goes with every question (so model use it before creates its own search queries)
  const formattedOnePages =
    sources
      .filter((source) => source.onePage)
      .map(
        (source) => `"${source.title}" by ${source.author}\n${source.onePage}`,
      )
      .join("\n\n") || "None.";

  const { tooManyQuestions, queries } = await searchQueriesChain.invoke({
    books,
    onePages: formattedOnePages,
    recentMessages: formattedRecentMessages,
    question,
  });

  // TODO: replace with splitting the message into separate questions.
  if (tooManyQuestions) {
    return {
      parts: [
        {
          type: "text",
          content: [{ type: "text", text: ONE_QUESTION_AT_A_TIME }],
        },
      ],
      citations: [],
    };
  }

  const rewrittenQueries = queries.slice(0, MAX_SEARCH_QUERIES);

  // The question is searched too, in its own words: rewrites find what it
  // doesn't name, and it catches what a drifting rewrite misses. Compared in
  // docs/retrieval.md.
  const searchQueries = [question, ...rewrittenQueries];

  const retrievedPerSource = await Promise.all(
    sources.map(async (source) => {
      const retrieved = await retrieveFromSourceId(searchQueries, source.id);
      const book = { title: source.title, author: source.author };

      const passagesInBookOrder = retrieved.passages.toSorted(
        (a, b) => (a.page ?? 0) - (b.page ?? 0),
      );
      const notesInBookOrder = retrieved.notes.toSorted(
        (a, b) => a.firstPage - b.firstPage,
      );

      return {
        passages: passagesInBookOrder.map((row) => ({ ...row, ...book })),
        notes: notesInBookOrder.map((note) => ({ ...note, ...book })),
      };
    }),
  );
  const passages = retrievedPerSource.flatMap(
    (retrieved) => retrieved.passages,
  );
  const notes = retrievedPerSource.flatMap((retrieved) => retrieved.notes);

  const formattedPassages = passages
    .map(
      (passage, index) =>
        `[${index + 1}] "${passage.title}" by ${passage.author}, p. ${passage.page}\n${passage.content}`,
    )
    .join("\n\n");

  // No numbers, so the model can't cite a Note like a passage.
  const formattedNotes = notes
    .map(
      (note) =>
        `Notes on "${note.heading}" in "${note.title}" by ${note.author}, pp. ${note.firstPage}–${note.lastPage}\n${note.content}`,
    )
    .join("\n\n");

  const reply = await answerChain.invoke({
    onePages: formattedOnePages,
    notes: formattedNotes || "None.",
    passages: formattedPassages,
    recentMessages: formattedRecentMessages,
    question,
  });

  if (!reply.covered && !reply.answer.trim()) {
    return { parts: [{ type: "not-covered" }], citations: [] };
  }

  return toCitedAnswer(reply.answer, passages);
};
