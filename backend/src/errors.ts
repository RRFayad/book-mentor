import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

// Throw for expected failures: throw new HttpError(404, "Source not found").
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    detail: string,
  ) {
    super(detail);
  }
}

// Every error becomes { detail }; 500s are logged and never leak their message.
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const status = hasZodFastifySchemaValidationErrors(error)
    ? 422
    : (error.statusCode ?? 500);
  if (status >= 500) request.log.error(error);

  return reply
    .code(status)
    .send({ detail: status >= 500 ? "Internal Server Error" : error.message });
};
