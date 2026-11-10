import { z } from "zod";

import { MENTOR_ANSWER_STATUSES, SOURCE_LIMIT } from "../constants";
import { isoDateTimeSchema } from "./common.schema";
import { sourceKindSchema } from "./sources.schema";

// ---------- Messages ----------

export const citationLocationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("page"), page: z.number().int().min(1) }),
  z.object({ kind: z.literal("post"), postTitle: z.string(), url: z.url() }),
]);

// Citations are numbered from 1 inside each answer. The quoted text is saved
// with the answer, so it stays readable after the Source's Expiry (ADR 0003).
export const citationSchema = z.object({
  number: z.number().int().min(1),
  sourceId: z.uuid(),
  sourceTitle: z.string(),
  author: z.string(),
  location: citationLocationSchema,
  quotedText: z.string(),
});

// Text with inline Citation markers. A marker refers to a Citation number in
// the same answer.
export const richTextSchema = z.array(
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("text"), text: z.string() }),
    z.object({ type: z.literal("citation"), number: z.number().int().min(1) }),
  ]),
);

export const answerSectionSchema = z.enum(["agreements", "conflicts"]);

export const answerPartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("section"),
    section: answerSectionSchema,
    content: richTextSchema,
  }),
  z.object({
    type: z.literal("positions"),
    positions: z.array(
      z.object({ sourceId: z.uuid(), content: richTextSchema }),
    ),
  }),
  z.object({
    type: z.literal("not-addressed"),
    sourceId: z.uuid(),
    content: richTextSchema,
  }),
  z.object({ type: z.literal("not-covered") }),
  z.object({ type: z.literal("text"), content: richTextSchema }),
]);

export const mentorAnswerStatusSchema = z.enum(MENTOR_ANSWER_STATUSES);

export const userMessageSchema = z.object({
  id: z.uuid(),
  role: z.literal("user"),
  text: z.string(),
});

export const mentorAnswerSchema = z.object({
  id: z.uuid(),
  role: z.literal("mentor"),
  status: mentorAnswerStatusSchema,
  parts: z.array(answerPartSchema),
  citations: z.array(citationSchema),
});

export const messageSchema = z.discriminatedUnion("role", [
  userMessageSchema,
  mentorAnswerSchema,
]);

// ---------- Conversation ----------

export const conversationParamsSchema = z.object({
  id: z.uuid(),
});

export const conversationListItemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  lastActivityAt: isoDateTimeSchema,
});

// A Source as a Conversation sees it. It stays listed after its Expiry.
export const conversationSourceSchema = z.object({
  id: z.uuid(),
  kind: sourceKindSchema,
  title: z.string(),
  author: z.string(),
  expired: z.boolean(),
});

export const conversationResponseSchema = conversationListItemSchema.extend({
  sources: z.array(conversationSourceSchema),
  messages: z.array(messageSchema),
});

// ---------- GET /conversations ----------

export const getConversationsResponseSchema = z.array(
  conversationListItemSchema,
);

// ---------- POST /conversations ----------

export const createConversationRequestBodySchema = z.object({
  sourceIds: z.array(z.uuid()).min(1).max(SOURCE_LIMIT),
  firstQuestion: z.string().min(1),
});

export const createConversationResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("created"), conversationId: z.uuid() }),
  z.object({ status: z.literal("limit-reached") }),
  z.object({ status: z.literal("failed") }),
]);

// ---------- PATCH /conversations/:id ----------

export const renameConversationRequestBodySchema = z.object({
  title: z.string().min(1),
});

export const renameConversationResponseSchema = conversationListItemSchema;

// ---------- POST /conversations/:id/messages ----------

// The client chooses both ids, so it can show the messages before the reply.
export const sendMessageRequestBodySchema = z.object({
  userMessageId: z.uuid(),
  answerId: z.uuid(),
  text: z.string().min(1),
});

export const sendMessageResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("answered"), answer: mentorAnswerSchema }),
  z.object({ status: z.literal("limit-reached") }),
  z.object({ status: z.literal("failed") }),
]);

// ---------- Types ----------

export type CitationLocation = z.infer<typeof citationLocationSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type RichText = z.infer<typeof richTextSchema>;
export type AnswerSection = z.infer<typeof answerSectionSchema>;
export type AnswerPart = z.infer<typeof answerPartSchema>;
export type MentorAnswerStatus = z.infer<typeof mentorAnswerStatusSchema>;
export type UserMessage = z.infer<typeof userMessageSchema>;
export type MentorAnswer = z.infer<typeof mentorAnswerSchema>;
export type Message = z.infer<typeof messageSchema>;

export type ConversationParams = z.infer<typeof conversationParamsSchema>;
export type ConversationListItem = z.infer<typeof conversationListItemSchema>;
export type ConversationSource = z.infer<typeof conversationSourceSchema>;
export type Conversation = z.infer<typeof conversationResponseSchema>;
export type GetConversationsResponse = z.infer<
  typeof getConversationsResponseSchema
>;
export type CreateConversationRequestBody = z.infer<
  typeof createConversationRequestBodySchema
>;
export type CreateConversationResponse = z.infer<
  typeof createConversationResponseSchema
>;
export type RenameConversationRequestBody = z.infer<
  typeof renameConversationRequestBodySchema
>;
export type RenameConversationResponse = z.infer<
  typeof renameConversationResponseSchema
>;
export type SendMessageRequestBody = z.infer<
  typeof sendMessageRequestBodySchema
>;
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;
