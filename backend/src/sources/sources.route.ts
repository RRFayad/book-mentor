import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createSourceHandler,
  completeSourceIngestionHandler,
  deleteSourceHandler,
  getSourcesHandler,
  ingestPagesHandler,
} from "./sources.controller";
import {
  completeSourceIngestionResponseSchema,
  createSourceResponseSchema,
  createSourceRequestBodySchema,
  getSourcesResponseSchema,
  ingestPagesResponseSchema,
  ingestPagesRequestBodySchema,
  sourceParamsSchema,
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
        response: { 201: createSourceResponseSchema },
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
        response: { 200: ingestPagesResponseSchema },
      },
    },
    ingestPagesHandler,
  );
  server.post(
    "/:id/complete",
    {
      schema: {
        params: sourceParamsSchema,
        response: { 200: completeSourceIngestionResponseSchema },
      },
    },
    completeSourceIngestionHandler,
  );
  server.delete(
    "/:id",
    {
      schema: {
        params: sourceParamsSchema,
        response: { 204: z.null() },
      },
    },
    deleteSourceHandler,
  );
};

export default sourcesRoutes;
