import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
import { getEnvVar } from "./src/lib/utils";

dotenv.config({ path: ".env.local" });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnvVar("DATABASE_URL"),
  },
} satisfies Config;
