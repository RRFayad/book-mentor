import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { TEST_DATABASE_URL } from "./test-env";

const MIGRATIONS_FOLDER = fileURLToPath(
  new URL("../../../packages/shared/src/db/migrations", import.meta.url),
);

// Runs once before all tests: creates the test database if it's missing, then
// applies every migration, so it always matches the real schema.
const setUpTestDatabase = async () => {
  const databaseUrl = new URL(TEST_DATABASE_URL);
  const databaseName = databaseUrl.pathname.slice(1);

  const serverUrl = new URL(TEST_DATABASE_URL);
  serverUrl.pathname = "/postgres";

  const server = postgres(serverUrl.toString(), { onnotice: () => {} });
  const existing =
    await server`select 1 from pg_database where datname = ${databaseName}`;

  if (existing.length === 0) {
    await server.unsafe(`create database "${databaseName}"`);
  }

  await server.end();

  const client = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });

  await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
  await client.end();
};

export default setUpTestDatabase;
