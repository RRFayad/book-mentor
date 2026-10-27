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

// ---------- Library ----------

type GetSourcesIO = { Reply: GetSourcesResponse };

export const getSourcesHandler = async (
  request: FastifyRequest<GetSourcesIO>,
  reply: FastifyReply<GetSourcesIO>,
) => {
  const userSources = await getSourcesByUserId(request.user.id);

  return reply.send(userSources);
};

type CreateSourceIO = {
  Body: CreateSourceRequestBody;
  Reply: CreateSourceResponse;
};

export const createSourceHandler = async (
  request: FastifyRequest<CreateSourceIO>,
  reply: FastifyReply<CreateSourceIO>,
) => {
  const body = request.body;
  const user = request.user;

  const [newSource] = await createSource(body, user.id);

  return reply.code(201).send({ status: "added", source: newSource });
};

type DeleteSourceIO = { Params: SourceParams; Reply: null };

export const deleteSourceHandler = async (
  request: FastifyRequest<DeleteSourceIO>,
  reply: FastifyReply<DeleteSourceIO>,
) => {
  await deleteSourceByUserId(request.params.id, request.user.id);

  return reply.code(204).send(null);
};

// ---------- Ingestion ----------

type IngestPagesIO = {
  Params: SourceParams;
  Body: IngestPagesRequestBody;
  Reply: IngestPagesResponse;
};

export const ingestPagesHandler = async (
  request: FastifyRequest<IngestPagesIO>,
  reply: FastifyReply<IngestPagesIO>,
) => {
  const progress = await ingestPagesByUserId(
    request.params.id,
    request.user.id,
    request.body.pages,
  );

  return reply.send(progress);
};

type CompleteSourceIngestionIO = {
  Params: SourceParams;
  Reply: CompleteSourceIngestionResponse;
};

export const completeSourceIngestionHandler = async (
  request: FastifyRequest<CompleteSourceIngestionIO>,
  reply: FastifyReply<CompleteSourceIngestionIO>,
) => {
  const source = await completeSourceIngestionByUserId(
    request.params.id,
    request.user.id,
  );

  return reply.send(source);
};
