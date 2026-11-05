import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { chatModel, chatModelWithoutReasoning } from "../ai-models";

const NOTES_SYSTEM_PROMPT = `
You take study notes on part of a book, so that a reader's questions about it can be answered later.

The pages below are marked like [p. 176]. They may start or end in the middle of a section.

Rules:
- Follow the book's own structure: one section per chapter or major part found in these pages, in order, named with the book's heading.
- Subsections (a single step, item, or example) go inside their section's notes, under their own heading, not as sections of their own.
- Name every item of every list, step sequence, or table. Never write "several items" or "and more": list them all, with the details the book gives for each (numbers, amounts, order, conditions).
- Give key claims, definitions, and recommendations in a few words each.
- End every line with the page it comes from, like (p. 198).
- Write only what these pages say. Never add knowledge, advice, or opinions of your own.
- Write in the language of the book.
- Skip front matter, acknowledgments, indexes, and running page headers.
`;

const notesPrompt = ChatPromptTemplate.fromMessages<{ pages: string }>([
  ["system", NOTES_SYSTEM_PROMPT],
  ["human", "{pages}"],
]);

const notesSchema = z.object({
  sections: z.array(
    z.object({
      heading: z
        .string()
        .describe("The section's heading, as the book writes it"),
      firstPage: z.number().int(),
      lastPage: z.number().int(),
      content: z
        .string()
        .describe("Short lines, each ending with its page like (p. 198)"),
    }),
  ),
});

export const notesChain = notesPrompt.pipe(
  chatModelWithoutReasoning.withStructuredOutput(notesSchema),
);

const ONE_PAGE_SYSTEM_PROMPT = `
You write a book's One Page: its big picture, built from the study notes taken on it section by section, so that a reader's questions about the whole book can be answered later.

Rules:
- Start with what the book is about and its main argument or purpose, in a few sentences.
- Then follow the book's structure: its parts or chapters in order, with what each one contributes to the whole.
- Keep what the book itself stresses most: its key principles, methods, and recommendations.
- Name the section and pages behind each point, like (Chapter 3, pp. 40–52), so it can be checked.
- Write only what the notes say. Never add knowledge, advice, or opinions of your own.
- Write in the language of the book.
- Keep it to one or two pages: the big picture, not the details each section holds.
`;

const onePagePrompt = ChatPromptTemplate.fromMessages<{ notes: string }>([
  ["system", ONE_PAGE_SYSTEM_PROMPT],
  ["human", "{notes}"],
]);

const onePageSchema = z.object({
  onePage: z.string().describe("The book's big picture, in plain text"),
});

// Written once per book, from the whole book: worth the model's reasoning.
export const onePageChain = onePagePrompt.pipe(
  chatModel.withStructuredOutput(onePageSchema),
);
