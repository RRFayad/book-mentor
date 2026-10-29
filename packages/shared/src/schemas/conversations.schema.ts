import { z } from "zod";

import { SOURCE_LIMIT } from "../constants";
import { isoDateTimeSchema } from "./common.schema";
import { sourceKindSchema } from "./sources.schema";

// ---------- Conversation ----------

export const conversationParamsSchema = z.object({
  id: z.uuid(),
});

export const conversationSummarySchema = z.object({
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

export const conversationResponseSchema = conversationSummarySchema.extend({
  sources: z.array(conversationSourceSchema),
});

// ---------- GET /conversations ----------

export const getConversationsResponseSchema = z.array(
  conversationSummarySchema,
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

export const renameConversationResponseSchema = conversationSummarySchema;

// ---------- Types ----------

export type ConversationParams = z.infer<typeof conversationParamsSchema>;
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;
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
