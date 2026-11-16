# One Drizzle schema for every table

- **Context:** the backend is Fastify (TypeScript), from SaaS Starter Kit v2, replacing FastAPI.
- **Decision:** every table, SaaS and product, in one Drizzle schema: `packages/shared/src/db/schema.ts`.
  - Both apps import it from `@app/shared` → one definition per table and its row types.
  - Next.js writes `users`, `subscriptions`; the API writes the product tables.
- **How to change it:** edit the schema → `npm run db:generate` → `npm run db:migrate`.
  - Never `drizzle-kit push`: every change goes through a migration.
- `chunks` is here too, with a pgvector column, queried with Drizzle (ADR 0002).

## Considered Options

- **Keep FastAPI + SQLAlchemy/Alembic for product tables** (ADR 0005): all-Python product, but two schema tools on one database, and API types written twice (Pydantic + TypeScript).

## Consequences

- Supersedes ADR 0005.
- An old local database may still have Alembic's `sources` and `alembic_version` tables: drop them before generating the Drizzle migration for `sources`.
