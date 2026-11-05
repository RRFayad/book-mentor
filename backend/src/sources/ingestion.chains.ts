import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { chatModel } from "../ai-models";

const NOTES_SYSTEM_PROMPT = `
You take study notes on part of a book, so that a reader's questions about it can be answered later.

The pages below are marked like [p. 176]. They may start or end in the middle of a section.

Rules:
- Follow the book's own structure: one section per chapter or major part found in these pages, in order, named with the book's heading.
- Subsections (a single step, item, or example) go inside their section's notes, under their own heading, not as sections of their own.
- If the pages start in the middle of a section, never skip those pages: write them as a section of their own, headed with the topic they continue and "(continued)", then go on with every section that follows, up to the last page.
- Name every item of every list, step sequence, or table. Never write "several items" or "and more": list them all, with the details the book gives for each (numbers, amounts, order, conditions).
- Give key claims, definitions, and recommendations in a few words each.
- End every line with the page it comes from, like (p. 198).
- Write only what these pages say. Never add knowledge, advice, or opinions of your own.
- Write in the language of the book.
- Skip title and copyright pages, tables of contents, acknowledgments, indexes, and running page headers. Keep prefaces, forewords, and introductions: they are part of the book.
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

// Keeps the model's reasoning: without it, the model often stopped after a
// batch's first section (3 of 5 runs on one batch, against 5 of 5 with it).
export const notesChain = notesPrompt.pipe(
  chatModel.withStructuredOutput(notesSchema),
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
- Keep the book's key rules and numbers: how much, how often, how long, and when to change course.
- Keep it to one or two pages: leave out examples and details that only matter inside one section.
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
