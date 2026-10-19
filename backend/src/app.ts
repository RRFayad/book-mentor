import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getEnvVar } from "@app/shared/utils";
import { authenticate } from "./auth/authenticate";
import { clerkPlugin } from "@clerk/fastify";
import type { User } from "@app/shared/types";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
  }
}

const app = Fastify({ logger: true });

app.register(fastifyCors, { origin: getEnvVar("FRONTEND_URL") });
app.register(clerkPlugin);

app.decorateRequest("user");

// ---------- Public routes ----------
app.register(async (publicApp) => {
  publicApp.get("/healthcheck", async () => {
    return { status: "OK" };
  });
});

// ---------- Protected routes ----------
app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authenticate);
});

const main = async () => {
  const port = Number(getEnvVar("PORT", false) ?? 8000);
  const host = getEnvVar("HOST", false) ?? "localhost";

  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

main();
