import { deleteExpiredSourcesResponseSchema } from "@app/shared/schemas";
import { getEnvVar } from "@app/shared/utils";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { HttpError } from "../errors";
import { deleteExpiredSourcesText } from "../sources/sources.service";

const cronRoutes: FastifyPluginAsyncZod = async (server) => {
  server.addHook("preHandler", async (request) => {
    const cronSecret = getEnvVar("CRON_SECRET", false);

    if (
      !cronSecret ||
      request.headers.authorization !== `Bearer ${cronSecret}`
    ) {
      throw new HttpError(401, "Unauthorized");
    }
  });

  server.get(
    "/delete-expired-sources",
    {
      schema: {
        response: { 200: deleteExpiredSourcesResponseSchema },
      },
    },
    async () => {
      const deletedPassages = await deleteExpiredSourcesText();

      return { deletedPassages };
    },
  );
};

export default cronRoutes;
