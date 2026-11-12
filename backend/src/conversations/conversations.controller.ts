import {
  Conversation,
  ConversationParams,
  CreateConversationRequestBody,
  CreateConversationResponse,
  GetConversationsResponse,
  MessageUsageResponse,
  RenameConversationRequestBody,
  RenameConversationResponse,
  SendMessageRequestBody,
  SendMessageResponse,
} from "@app/shared/schemas";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  createConversation,
  deleteConversationByUserId,
  getConversationByUserId,
  getConversationsByUserId,
  getMessageUsageByUserId,
  renameConversationByUserId,
  sendMessage,
} from "./conversations.service";

type GetConversationsIO = { Reply: GetConversationsResponse };

export const getConversationsHandler = async (
  request: FastifyRequest<GetConversationsIO>,
  reply: FastifyReply<GetConversationsIO>,
) => {
  const userConversations = await getConversationsByUserId(request.user.id);

  return reply.send(userConversations);
};

type GetConversationIO = { Params: ConversationParams; Reply: Conversation };

export const getConversationHandler = async (
  request: FastifyRequest<GetConversationIO>,
  reply: FastifyReply<GetConversationIO>,
) => {
  const conversation = await getConversationByUserId(
    request.params.id,
    request.user.id,
  );

  return reply.send(conversation);
};

type CreateConversationIO = {
  Body: CreateConversationRequestBody;
  Reply: CreateConversationResponse;
};

export const createConversationHandler = async (
  request: FastifyRequest<CreateConversationIO>,
  reply: FastifyReply<CreateConversationIO>,
) => {
  const body = request.body;
  const user = request.user;

  const newConversationId = await createConversation(body, user.id);

  return reply
    .code(201)
    .send({ status: "created", conversationId: newConversationId });
};

type RenameConversationIO = {
  Params: ConversationParams;
  Body: RenameConversationRequestBody;
  Reply: RenameConversationResponse;
};

export const renameConversationHandler = async (
  request: FastifyRequest<RenameConversationIO>,
  reply: FastifyReply<RenameConversationIO>,
) => {
  const conversation = await renameConversationByUserId(
    request.params.id,
    request.user.id,
    request.body.title,
  );

  return reply.send(conversation);
};

type DeleteConversationIO = { Params: ConversationParams; Reply: null };

export const deleteConversationHandler = async (
  request: FastifyRequest<DeleteConversationIO>,
  reply: FastifyReply<DeleteConversationIO>,
) => {
  await deleteConversationByUserId(request.params.id, request.user.id);

  return reply.code(204).send(null);
};

type SendMessageIO = {
  Params: ConversationParams;
  Body: SendMessageRequestBody;
  Reply: SendMessageResponse;
};

export const sendMessageHandler = async (
  request: FastifyRequest<SendMessageIO>,
  reply: FastifyReply<SendMessageIO>,
) => {
  const answer = await sendMessage(
    request.params.id,
    request.body,
    request.user.id,
  );

  return reply.code(201).send({ status: "answered", answer });
};

type GetMessageUsageIO = { Reply: MessageUsageResponse };

export const getMessageUsageHandler = async (
  request: FastifyRequest<GetMessageUsageIO>,
  reply: FastifyReply<GetMessageUsageIO>,
) => {
  const messageUsage = await getMessageUsageByUserId(request.user.id);

  return reply.send(messageUsage);
};
