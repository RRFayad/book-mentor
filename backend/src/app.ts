import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getEnvVar } from "@app/shared/utils";
import { authenticate } from "./auth/authenticate";
import { requireSubscriptionPlan } from "./auth/subscription";
import { dashboardRoutes } from "./dashboard/dashboard.route";
import { healthcheckRoutes } from "./healthcheck/healthcheck.route";
import { clerkPlugin } from "@clerk/fastify";
import type { Subscription, User } from "@app/shared/types";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

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

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "SaaS Starter Kit API",
      version: process.env["npm_package_version"] ?? "dev",
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  transform: jsonSchemaTransform, // Converts the zod schemas into the docs
});
app.register(fastifySwaggerUi, { routePrefix: "/docs" });

// ---------- Public routes ----------
app.register(async (publicApp) => {
  publicApp.register(healthcheckRoutes);
});

// ---------- Protected routes ----------
app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authenticate);

  // ---------- Subscription protected routes ----------
  protectedApp.register(async (subscribedApp) => {
    subscribedApp.addHook("preHandler", requireSubscriptionPlan("basic"));
    subscribedApp.register(dashboardRoutes);
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
