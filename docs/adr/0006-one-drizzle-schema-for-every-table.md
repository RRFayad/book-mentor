# One Drizzle schema for every table

The backend is Fastify (TypeScript), taken from SaaS Starter Kit v2, which replaced FastAPI. Every table, SaaS and product, is defined in the one Drizzle schema in `packages/shared/src/db/schema.ts` and migrated with drizzle-kit. Both apps import it from `@app/shared`, so a table and its row types have a single definition. Next.js writes the SaaS tables (`users`, `subscriptions`); the API writes the product tables (Sources, Chunks, Conversations, messages).

- Product tables are added to the shared schema, then `npm run db:generate` creates the migration and `npm run db:migrate` applies it.
- `drizzle-kit push` is still never used: every change goes through a migration.
- The `chunks` table is defined here too, with a pgvector column, and LangChain's `PGVectorStore` reads and writes it but never creates it (ADR 0002).

## Considered Options

- Keep the FastAPI backend with SQLAlchemy and Alembic for the product tables (ADR 0005): the whole product in Python, but two schema tools on one database, and the API types written twice (Pydantic and TypeScript).

## Consequences

- Supersedes ADR 0005. The Alembic `sources` table and `alembic_version` table in an existing local database are left over; drop them before generating the Drizzle migration for `sources`.
