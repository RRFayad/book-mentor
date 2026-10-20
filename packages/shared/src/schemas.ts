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

// ---------- Dashboard (sample endpoint) ----------

export const dashboardMetricIconSchema = z.enum([
  "revenue",
  "customers",
  "conversion",
  "refunds",
]);

export const dashboardResponseSchema = z.object({
  user_email: z.string(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      change: z.string(),
      icon: dashboardMetricIconSchema,
      positive: z.boolean(),
    }),
  ),
  revenue_activity: z.object({
    total: z.string(),
    points: z.array(
      z.object({
        label: z.string(),
        value: z.number(),
      }),
    ),
  }),
  recent_activity: z.array(
    z.object({
      customer: z.string(),
      action: z.string(),
      amount: z.string(),
    }),
  ),
});

export type DashboardMetricIcon = z.infer<typeof dashboardMetricIconSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
