import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createConversationHandler,
  deleteConversationHandler,
  getConversationHandler,
  getConversationsHandler,
  renameConversationHandler,
} from "./conversations.controller";
import {
  conversationParamsSchema,
  conversationResponseSchema,
  createConversationRequestBodySchema,
  createConversationResponseSchema,
  getConversationsResponseSchema,
  renameConversationRequestBodySchema,
  renameConversationResponseSchema,
} from "@app/shared/schemas";

const conversationsRoutes: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/",
    {
      schema: {
        response: { 200: getConversationsResponseSchema },
      },
    },
    getConversationsHandler,
  );
  server.get(
    "/:id",
    {
      schema: {
        params: conversationParamsSchema,
        response: { 200: conversationResponseSchema },
      },
    },
    getConversationHandler,
  );
  server.post(
    "/",
    {
      schema: {
        body: createConversationRequestBodySchema,
        response: { 201: createConversationResponseSchema },
      },
    },
    createConversationHandler,
  );
  server.patch(
    "/:id",
    {
      schema: {
        params: conversationParamsSchema,
        body: renameConversationRequestBodySchema,
        response: { 200: renameConversationResponseSchema },
      },
    },
    renameConversationHandler,
  );
  server.delete(
    "/:id",
    {
      schema: {
        params: conversationParamsSchema,
        response: { 204: z.null() },
      },
    },
    deleteConversationHandler,
  );
};

export default conversationsRoutes;
