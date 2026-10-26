import {
  CompleteSourceIngestionResponse,
  CreateSourceRequestBody,
  CreateSourceResponse,
  GetSourcesResponse,
  IngestPagesRequestBody,
  IngestPagesResponse,
  SourceParams,
} from "@app/shared/schemas";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  completeSourceIngestionByUserId,
  createSource,
  deleteSourceByUserId,
  getSourcesByUserId,
  ingestPagesByUserId,
} from "./sources.service";

type GetSourcesRoute = { Reply: GetSourcesResponse };
type CreateSourceRoute = {
  Body: CreateSourceRequestBody;
  Reply: CreateSourceResponse;
};
type IngestPagesRoute = {
  Params: SourceParams;
  Body: IngestPagesRequestBody;
  Reply: IngestPagesResponse;
};
type CompleteSourceIngestionRoute = {
  Params: SourceParams;
  Reply: CompleteSourceIngestionResponse;
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

export const ingestPagesHandler = async (
  request: FastifyRequest<IngestPagesRoute>,
  reply: FastifyReply<IngestPagesRoute>,
) => {
  const progress = await ingestPagesByUserId(
    request.params.id,
    request.user.id,
    request.body.pages,
  );

  return reply.send(progress);
};

export const completeSourceIngestionHandler = async (
  request: FastifyRequest<CompleteSourceIngestionRoute>,
  reply: FastifyReply<CompleteSourceIngestionRoute>,
) => {
  const source = await completeSourceIngestionByUserId(
    request.params.id,
    request.user.id,
  );

  return reply.send(source);
};
export const deleteSourceHandler = async (
  request: FastifyRequest<DeleteSourceRoute>,
  reply: FastifyReply<DeleteSourceRoute>,
) => {
  await deleteSourceByUserId(request.params.id, request.user.id);

  return reply.code(204).send(null);
};
