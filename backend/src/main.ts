import { getEnvVar } from "@app/shared/utils";

import { createApp } from "./create-app";

const main = async () => {
  const app = await createApp();
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
