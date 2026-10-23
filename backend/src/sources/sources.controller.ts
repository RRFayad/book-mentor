import {
  CreateSourceRequestBody,
  CreateSourceResponse,
  GetSourcesResponse,
  SourceParams,
} from "@app/shared/schemas";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  createSource,
  deleteSourceByUserId,
  getSourcesByUserId,
} from "./sources.service";

type GetSourcesRoute = { Reply: GetSourcesResponse };
type CreateSourceRoute = {
  Body: CreateSourceRequestBody;
  Reply: CreateSourceResponse;
};
type DeleteSourceRoute = { Params: SourceParams; Reply: null };

export const getSourcesHandler = async (
  request: FastifyRequest<GetSourcesRoute>,
  reply: FastifyReply<GetSourcesRoute>,
) => {
  const userSources = await getSourcesByUserId(request.user.id);

  return reply.send(userSources);
};

export const createSourceHandler = async (
  request: FastifyRequest<CreateSourceRoute>,
  reply: FastifyReply<CreateSourceRoute>,
) => {
  const body = request.body;
  const user = request.user;

  const [newSource] = await createSource(body, user.id);

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
export const deleteSourceHandler = async (
  request: FastifyRequest<DeleteSourceRoute>,
  reply: FastifyReply<DeleteSourceRoute>,
) => {
  await deleteSourceByUserId(request.params.id, request.user.id);

  return reply.code(204).send(null);
};
export const getSourceConversationCount = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {};
