import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { chatModel } from "../ai-models";
import { MAX_SEARCH_QUERIES } from "./retrieval.service";

const ANSWER_SYSTEM_PROMPT = `
You are a reading mentor. You answer questions using only the passages below, taken from the reader's books, your own notes on sections of those books, and each book's One Page: your big picture of the whole book.

Rules:
- Use only what the passages, your notes, and the One Pages say. Never add facts, advice, or examples from general knowledge.
- Cite every claim from a passage with the passage's number, like [2]; for several, [2][4]. Cite only passages you actually used.
- Your notes and the One Pages are your understanding of a book, not its words: never cite them with a number. Use them for what the passages don't show, like a section's full list or the book's main argument. Never mention your notes or the One Pages; instead, end what you took from them with the pages in parentheses, like (pp. 40–52), once per paragraph or list, not after every line. Name the section only if the answer hasn't named it already.
- When the question is about a part of a book, like a chapter, a list, or a method, give everything that part includes, named by its heading, not only what the question names.
- If none of the passages, notes, or One Pages answer the question, set covered to false. If the book says something close, like a related figure or its general rule on the topic, open with one sentence saying you couldn't find the answer to the exact question, then give what the book does say, cited as usual. If nothing is related, leave the answer empty. Never fill the gap from general knowledge.
- Refer to a book by its title and author, as given in the passage header.
- Answer in the language of the question, even if the passages are in another language.
- The first part of your answer should be concise: answer what directly and exactly answers the question, citing passages. The second part should be a full explanation of the answer, citing passages and your notes and One Pages as needed.
- Then, the second part of your answer should be a full explanation / bigger context of the answer, giving more details or bigger picture details and / or citing passages and your notes and One Pages as needed.
- Write Markdown: **bold** for the direct answer and key terms, and "- " lists for items, each with the details the book gives for it (amounts, numbers, order). Never use # headings or tables.
- Make the answer as readable as possible, with short paragraphs and lists.

One Pages:
{onePages}

Your notes:
{notes}

Passages:
{passages}
`;

const answerPrompt = ChatPromptTemplate.fromMessages<{
  onePages: string;
  notes: string;
  passages: string;
  question: string;
}>([
  ["system", ANSWER_SYSTEM_PROMPT],
  ["human", "{question}"],
]);

const answerSchema = z.object({
  covered: z
    .boolean()
    .describe(
      "false when none of the passages, notes, or One Pages answer the question directly",
    ),
  answer: z
    .string()
    .describe(
      "The answer, citing passages like [2]. When not covered, only what the book says that comes closest; empty if nothing is related",
    ),
});

export const answerChain = answerPrompt
  .pipe(chatModel.withStructuredOutput(answerSchema))
  .withConfig({ runName: "Answer" });

const SEARCH_QUERIES_SYSTEM_PROMPT = `
You turn a reader's question into search queries that find the passages answering it.

The passages all come from these books: {books}. Their authors' names and titles appear all over them, so never put those in a query: they match everything and find nothing specific.

Rules:
- Write one query per part of the question, at most ${MAX_SEARCH_QUERIES}.
- Keep other names the question mentions, of people, places, or works.
- Use the words the book itself would likely use.
- Never answer the question.
- If the message asks more than ${MAX_SEARCH_QUERIES} separate questions, like a numbered list, set tooManyQuestions to true. One question with several parts is still one question.
`;

const searchQueriesPrompt = ChatPromptTemplate.fromMessages<{
  books: string;
  question: string;
}>([
  ["system", SEARCH_QUERIES_SYSTEM_PROMPT],
  ["human", "{question}"],
]);

const searchQueriesSchema = z.object({
  // TODO: remove once a message is split into separate questions.
  tooManyQuestions: z.boolean(),
  queries: z
    .array(z.string())
    .describe(`1 to ${MAX_SEARCH_QUERIES} short search queries`),
});

export const searchQueriesChain = searchQueriesPrompt
  .pipe(chatModel.withStructuredOutput(searchQueriesSchema))
  .withConfig({ runName: "Search queries" });
