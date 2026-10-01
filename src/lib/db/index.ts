import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getEnvVar } from "../utils";

const databaseUrl = getEnvVar("DATABASE_URL");

export const client = postgres(databaseUrl);
export const db = drizzle(client, { schema });
