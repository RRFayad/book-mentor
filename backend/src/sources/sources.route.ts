import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createSourceHandler,
  completeSourceIngestionHandler,
  deleteSource,
  getSourceConversationCount,
  getSourcesHandler,
  ingestSourceBatchHandler,
} from "./sources.controller";
import {
  createSourceResponseSchema,
  createSourceBodySchema,
  errorResponseSchema,
  pageBatchResultSchema,
  pageBatchSchema,
  sourceParamsSchema,
  sourceResponseSchema,
} from "@app/shared/schemas";

const sourcesRoutes: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/",
    {
      schema: {
        response: { 200: z.array(sourceResponseSchema) },
      },
    },
    getSourcesHandler,
  );
  server.post(
    "/",
    {
      schema: {
        body: createSourceBodySchema,
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
        body: pageBatchSchema,
        response: { 200: pageBatchResultSchema, 404: errorResponseSchema },
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
    deleteSource,
  );
  server.get("/conversation-counts", {}, getSourceConversationCount);
};

export default sourcesRoutes;
