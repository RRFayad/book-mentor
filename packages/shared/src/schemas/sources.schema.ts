import { z } from "zod";

import { SOURCE_KINDS, SOURCE_STATES } from "../constants";
import { isoDateTimeSchema } from "./common.schema";

// ---------- Source ----------

export const sourceKindSchema = z.enum(SOURCE_KINDS);
export const sourceStateSchema = z.enum(SOURCE_STATES);

// A Source as the API returns it: the sources row without userId. Book-only
// and blog-only fields are null for the other kind.
export const sourceResponseSchema = z.object({
  id: z.uuid(),
  kind: sourceKindSchema,
  title: z.string(),
  author: z.string(),
  pageCount: z.int().nullable(), // books only
  postCount: z.int().nullable(), // blogs only
  address: z.string().nullable(), // blogs only
  state: sourceStateSchema,
  ingestionProgress: z.number(),
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
});

export const sourceParamsSchema = z.object({
  id: z.uuid(),
});

// ---------- POST /sources ----------

export const createSourceBodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("book"),
    title: z.string().min(1),
    author: z.string().min(1),
    pageCount: z.int().min(1),
  }),
  z.object({
    kind: z.literal("blog"),
    address: z.url(),
    title: z.string().min(1),
    author: z.string().min(1),
  }),
]);

export const createSourceResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("added"), source: sourceResponseSchema }),
  z.object({
    status: z.literal("rejected"),
    reason: z.enum(["scanned", "too-large"]),
  }),
  z.object({ status: z.literal("failed") }),
  z.object({ status: z.literal("limit-reached") }),
]);

// ---------- POST /sources/:id/pages ----------

export const pageTextSchema = z.object({
  page: z.int().min(1),
  text: z.string(),
});

export const pageBatchSchema = z.object({
  pages: z.array(pageTextSchema),
});

export const pageBatchResultSchema = z.object({
  ingestionProgress: z.number(),
});

// ---------- Types ----------

export type SourceKind = z.infer<typeof sourceKindSchema>;
export type SourceState = z.infer<typeof sourceStateSchema>;
export type Source = z.infer<typeof sourceResponseSchema>;
export type SourceParams = z.infer<typeof sourceParamsSchema>;
export type CreateSourceBody = z.infer<typeof createSourceBodySchema>;
export type CreateSourceResult = z.infer<typeof createSourceResponseSchema>;
export type PageText = z.infer<typeof pageTextSchema>;
export type PageBatch = z.infer<typeof pageBatchSchema>;
export type PageBatchResult = z.infer<typeof pageBatchResultSchema>;
