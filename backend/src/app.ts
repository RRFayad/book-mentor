import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getEnvVar } from "@app/shared/utils";
import { authenticate } from "./auth/authenticate";
import { requireSubscriptionPlan } from "./auth/subscription";
import { clerkPlugin } from "@clerk/fastify";
import type { Subscription, User } from "@app/shared/types";

declare module "fastify" {
  interface FastifyRequest {
    user: User; // Set by authenticate on protected routes.
    subscription: Subscription | null; // Set by requireSubscriptionPlan on subscribed routes (null when billing is disabled)
  }
}

const app = Fastify({ logger: true });

app.register(fastifyCors, { origin: getEnvVar("FRONTEND_URL") });
app.register(clerkPlugin);

app.decorateRequest("user");
app.decorateRequest("subscription");

// ---------- Public routes ----------
app.register(async (publicApp) => {
  publicApp.get("/healthcheck", async () => {
    return { status: "OK" };
  });
});

// ---------- Protected routes ----------
app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authenticate);

  // ---------- Subscription protected routes ----------
  protectedApp.register(async (subscribedApp) => {
    subscribedApp.addHook("preHandler", requireSubscriptionPlan("basic"));
  });
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
