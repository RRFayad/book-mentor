import { z } from "zod";

// API contract shared by the backend and the frontend. The backend attaches
// these schemas to routes (response validation and Swagger docs); the frontend
// uses the inferred types for the data it receives.

// ---------- Errors ----------

// Body of every error the API sends (401, 403, 404).
export const errorResponseSchema = z.object({
  detail: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// ---------- System ----------

export const healthcheckResponseSchema = z.object({
  status: z.string(),
});

export type HealthcheckResponse = z.infer<typeof healthcheckResponseSchema>;
