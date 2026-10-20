import {
  dashboardResponseSchema,
  errorResponseSchema,
} from "@app/shared/schemas";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { getDashboardHandler } from "./dashboard.controller";

export const dashboardRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/dashboard",
    {
      schema: {
        tags: ["dashboard"],
        summary: "Sample dashboard data for the signed-in user",
        security: [{ bearerAuth: [] }],
        response: {
          200: dashboardResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    getDashboardHandler,
  );
};
