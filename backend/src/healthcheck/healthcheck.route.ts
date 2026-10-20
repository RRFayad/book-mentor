import { healthcheckResponseSchema } from "@app/shared/schemas";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export const healthcheckRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/healthcheck",
    {
      schema: {
        tags: ["system"],
        summary: "Check that the API is running",
        response: { 200: healthcheckResponseSchema },
      },
    },
    async () => {
      return { status: "OK" };
    },
  );
};
