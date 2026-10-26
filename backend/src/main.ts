import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getEnvVar } from "@app/shared/utils";
import { authenticate } from "./auth/authenticate";
import { errorHandler } from "./errors";
import { healthcheckRoutes } from "./healthcheck/healthcheck.route";
import { clerkPlugin } from "@clerk/fastify";
import type { Subscription, User } from "@app/shared/db/schema";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import sourcesRoutes from "./sources/sources.route";

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

app.setErrorHandler(errorHandler);
app.setNotFoundHandler((_request, reply) =>
  reply.code(404).send({ detail: "Not found" }),
);

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
  protectedApp.register(sourcesRoutes, { prefix: "/sources" });
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
