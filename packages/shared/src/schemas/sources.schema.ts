import { z } from "zod";

import { SOURCE_KINDS, SOURCE_STATES } from "../constants";

// ---------- Source ----------

export const sourceKindSchema = z.enum(SOURCE_KINDS);
export const sourceStateSchema = z.enum(SOURCE_STATES);

const sourceDetailsSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("book"),
    pageCount: z.int(),
  }),
  z.object({
    kind: z.literal("blog"),
    postCount: z.int(),
    address: z.string(),
  }),
]);

const ingestionStatusSchema = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("ingesting"),
    ingestionProgress: z.number(),
  }),
  z.object({
    state: z.literal("ready"),
  }),
]);

export const sourceResponseSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    author: z.string(),
    addedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
  })
  .and(sourceDetailsSchema)
  .and(ingestionStatusSchema);

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

export const addSourceResponseSchema = z.discriminatedUnion("status", [
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
export type AddSourceResult = z.infer<typeof addSourceResponseSchema>;
export type PageText = z.infer<typeof pageTextSchema>;
export type PageBatch = z.infer<typeof pageBatchSchema>;
export type PageBatchResult = z.infer<typeof pageBatchResultSchema>;
