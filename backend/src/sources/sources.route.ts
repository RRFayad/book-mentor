import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createSourceHandler,
  completeSourceIngestionHandler,
  deleteSourceHandler,
  getSourceConversationCount,
  getSourcesHandler,
  ingestSourceBatchHandler,
} from "./sources.controller";
import {
  createSourceResponseSchema,
  createSourceRequestBodySchema,
  errorResponseSchema,
  getSourcesResponseSchema,
  ingestPagesResponseSchema,
  ingestPagesRequestBodySchema,
  sourceParamsSchema,
  sourceResponseSchema,
} from "@app/shared/schemas";

const sourcesRoutes: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/",
    {
      schema: {
        response: { 200: getSourcesResponseSchema },
      },
    },
    getSourcesHandler,
  );
  server.post(
    "/",
    {
      schema: {
        body: createSourceRequestBodySchema,
        response: { 201: createSourceResponseSchema, 422: errorResponseSchema },
      },
    },
    createSourceHandler,
  );
  server.post(
    "/:id/pages",
    {
      schema: {
        params: sourceParamsSchema,
        body: ingestPagesRequestBodySchema,
        response: { 200: ingestPagesResponseSchema, 404: errorResponseSchema },
      },
    },
    ingestSourceBatchHandler,
  );
  server.post(
    "/:id/complete",
    {
      schema: {
        params: sourceParamsSchema,
        response: { 200: sourceResponseSchema, 404: errorResponseSchema },
      },
    },
    completeSourceIngestionHandler,
  );
  server.delete(
    "/:id",
    {
      schema: {
        params: sourceParamsSchema,
        response: { 204: z.null(), 404: errorResponseSchema },
      },
    },
    deleteSourceHandler,
  );
  server.get("/conversation-counts", {}, getSourceConversationCount);
};

export default sourcesRoutes;
