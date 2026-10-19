import * as schema from "@app/shared/db/schema";
import { getEnvVar } from "@app/shared/utils";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Created once at import, so every request shares the same connection pool.
const client = postgres(getEnvVar("DATABASE_URL"));

export const db = drizzle(client, { schema });
