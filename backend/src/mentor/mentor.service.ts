import { ChunkRow, SourceRow } from "@app/shared/db/schema";
import { AnswerPart, Citation, RichText } from "@app/shared/schemas";

import { answerChain } from "./mentor.chains";
import { retrieveFromSourceId } from "./retrieval.service";

type MentorReply = { parts: AnswerPart[]; citations: Citation[] };

type Passage = Pick<ChunkRow, "sourceId" | "page" | "content"> &
  Pick<SourceRow, "title" | "author">;

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
    parts: [{ type: "section", section: "source-says", content }],
    citations,
  };
};

export const answerQuestion = async (
  question: string,
  sources: SourceRow[],
): Promise<MentorReply> => {
  const retrievedPerSource = await Promise.all(
    sources.map(async (source) => {
      const retrieved = await retrieveFromSourceId(question, source.id);
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

  // The One Page goes with every question. Never cited either.
  const formattedOnePages = sources
    .filter((source) => source.onePage)
    .map((source) => `"${source.title}" by ${source.author}\n${source.onePage}`)
    .join("\n\n");

  const reply = await answerChain.invoke({
    onePages: formattedOnePages || "None.",
    notes: formattedNotes || "None.",
    passages: formattedPassages,
    question,
  });

  // For now we don't handle the case where it can't answer from the passages
  if (!reply.covered) {
    return { parts: [{ type: "not-covered" }], citations: [] };
  }

  return toCitedAnswer(reply.answer, passages);
};
