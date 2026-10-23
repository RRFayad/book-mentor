import {
  CreateSourceRequestBody,
  CreateSourceResponse,
  GetSourcesResponse,
} from "@app/shared/schemas";
import { FastifyRequest, FastifyReply } from "fastify";
import { createSource, getSourcesByUser } from "./sources.service";

type GetSourcesRoute = { Reply: GetSourcesResponse };
type CreateSourceRoute = {
  Body: CreateSourceRequestBody;
  Reply: CreateSourceResponse;
};

export const getSourcesHandler = async (
  request: FastifyRequest<GetSourcesRoute>,
  reply: FastifyReply<GetSourcesRoute>,
) => {
  const userSources = await getSourcesByUser(request.user);

  return reply.send(userSources);
};

export const createSourceHandler = async (
  request: FastifyRequest<CreateSourceRoute>,
  reply: FastifyReply<CreateSourceRoute>,
) => {
  const body = request.body;
  const user = request.user;

  const [newSource] = await createSource(body, user);

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
