import { CreateSourceBody, CreateSourceResult } from "@app/shared/schemas";
import { FastifyRequest, FastifyReply } from "fastify";
import { addSource } from "./sources.service";

type CreateSourceRoute = { Body: CreateSourceBody; Reply: CreateSourceResult };

export const getSourcesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {};

export const createSourceHandler = async (
  request: FastifyRequest<CreateSourceRoute>,
  reply: FastifyReply<CreateSourceRoute>,
) => {
  const body = request.body;
  const user = request.user;

  const [newSource] = await addSource(body, user);

  return reply.code(201).send({ status: "added", source: newSource });
};

export const ingestSourceBatchHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {};
export const completeSourceIngestionHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {};
export const deleteSource = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {};
export const getSourceConversationCount = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {};
