import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { getEnvVar } from "@app/shared/utils";

const app = Fastify({ logger: true });

app.register(fastifyCors, { origin: getEnvVar("FRONTEND_URL") });

app.get("/healthcheck", async () => {
  return { status: "OK" };
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
