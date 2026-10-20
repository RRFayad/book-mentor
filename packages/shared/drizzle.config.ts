import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
import { getEnvVar } from "./src/utils";

// Runs from packages/shared; the env file lives at the repo root.
dotenv.config({ path: "../../.env.local" });

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnvVar("DATABASE_URL"),
  },
} satisfies Config;
