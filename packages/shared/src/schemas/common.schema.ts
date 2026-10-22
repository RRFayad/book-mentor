import { z } from "zod";

// ---------- Fields ----------

// A date sent as an ISO 8601 string. The API sends Date objects (Drizzle rows)
// and the JSON carries the string; parsing with the schema gives a Date back.
export const isoDateTimeSchema = z.codec(z.iso.datetime(), z.date(), {
  decode: (value) => new Date(value),
  encode: (date) => date.toISOString(),
});

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
