import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
import { getEnvVar } from "./src/utils";

// Runs from packages/shared; DATABASE_URL comes from the Next.js app's env file.
dotenv.config({ path: "../../frontend/.env.local" });

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnvVar("DATABASE_URL"),
  },
} satisfies Config;
