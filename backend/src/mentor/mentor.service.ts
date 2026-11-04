import { SourceRow } from "@app/shared/db/schema";
import { AnswerPart, Citation } from "@app/shared/schemas";
import { retrieveFromSourceId } from "./retrieval.service";
import { answerPrompt } from "./mentor.prompts";

type MentorReply = { parts: AnswerPart[]; citations: Citation[] };

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

  const filledPrompt = await answerPrompt.invoke({
    passages: formattedPassages,
    question,
  });

  console.log("PROMPT", filledPrompt.toString());

  //TODO: Replace with the RAG chain
  return {
    parts: [
      {
        type: "section",
        section: "source-says",
        content: [
          { type: "text", text: `You asked: "${question}". The Source says ` },
          { type: "citation", number: 1 },
          { type: "text", text: "." },
        ],
      },
      {
        type: "section",
        section: "meaning",
        content: [
          { type: "text", text: "This is a placeholder until the RAG chain." },
        ],
      },
    ],
    citations: [
      {
        number: 1,
        sourceId: "00000000-0000-4000-8000-000000000000",
        sourceTitle: "Placeholder Book",
        author: "Placeholder Author",
        location: { kind: "page", page: 1 },
        quotedText: "A hardcoded quote standing in for a retrieved chunk.",
      },
    ],
  };
};
