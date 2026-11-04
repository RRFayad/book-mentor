import { AnswerPart, Citation } from "@app/shared/schemas";
import { retrieveFromSourceId } from "./retrieval.service";

type MentorReply = { parts: AnswerPart[]; citations: Citation[] };

export const answerQuestion = async (
  question: string,
  sourceIds: string[],
): Promise<MentorReply> => {
  const passagesPerSource = await Promise.all(
    sourceIds.map((sourceId) => retrieveFromSourceId(question, sourceId)),
  );
  const passages = passagesPerSource.flat();

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
