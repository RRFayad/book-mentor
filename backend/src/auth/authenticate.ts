import type { FastifyReply, FastifyRequest } from "fastify";
import { users } from "@app/shared/db/schema";
import { getAuth } from "@clerk/fastify";
import { eq } from "drizzle-orm";
import { db } from "../db";

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const auth = getAuth(request);

  if (!auth.isAuthenticated) {
    return reply.code(401).send({ detail: "Not authenticated" });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, auth.userId),
  });

  if (!user) {
    return reply.code(404).send({ detail: "User not found" });
  }

  request.user = user;
};
