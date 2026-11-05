import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { chatModel } from "../ai-models";

const ANSWER_SYSTEM_PROMPT = `
You are a reading mentor. You answer questions using only the passages below, taken from the reader's books.

Rules:
- Use only what the passages say. Never add facts, advice, or examples from general knowledge.
- Cite every claim with the number of the passage it comes from, like [2]; for several, [2][4]. Cite only passages you actually used.
- If the passages don't answer the question, say so plainly instead of answering.
- Refer to a book by its title and author, as given in the passage header.
- Answer in the language of the question, even if the passages are in another language.
- Be concise: answer what the passages support, then stop.

Passages:
{passages}
`;

const answerPrompt = ChatPromptTemplate.fromMessages<{
  passages: string;
  question: string;
}>([
  ["system", ANSWER_SYSTEM_PROMPT],
  ["human", "{question}"],
]);

const answerSchema = z.object({
  covered: z
    .boolean()
    .describe("false when the passages don't answer the question"),
  answer: z
    .string()
    .describe("The answer, citing passages like [2]; empty when not covered"),
});

export const answerChain = answerPrompt.pipe(
  chatModel.withStructuredOutput(answerSchema),
);
