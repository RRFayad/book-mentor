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
  errorResponseSchema,
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
        response: {
          201: createSourceResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
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
        response: {
          200: ingestPagesResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    ingestPagesHandler,
  );
  server.post(
    "/:id/complete",
    {
      schema: {
        params: sourceParamsSchema,
        response: {
          200: completeSourceIngestionResponseSchema,
          404: errorResponseSchema,
        },
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
};

export default sourcesRoutes;
