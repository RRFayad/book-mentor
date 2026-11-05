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
  const passagesPerSource = await Promise.all(
    sources.map(async (source) => {
      const rows = await retrieveFromSourceId(question, source.id);
      const rowsInBookOrder = rows.toSorted(
        (a, b) => (a.page ?? 0) - (b.page ?? 0),
      );

      return rowsInBookOrder.map((row) => ({
        ...row,
        title: source.title,
        author: source.author,
      }));
    }),
  );
  const passages = passagesPerSource.flat();

  const formattedPassages = passages
    .map(
      (passage, index) =>
        `[${index + 1}] "${passage.title}" by ${passage.author}, p. ${passage.page}\n${passage.content}`,
    )
    .join("\n\n");

  const reply = await answerChain.invoke({
    passages: formattedPassages,
    question,
  });

  // For now we don't handle the case where it can't answer from the passages
  if (!reply.covered) {
    return { parts: [{ type: "not-covered" }], citations: [] };
  }

  return toCitedAnswer(reply.answer, passages);
};
