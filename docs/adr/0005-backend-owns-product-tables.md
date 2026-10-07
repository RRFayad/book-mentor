# The backend owns the product tables

Drizzle owns the SaaS tables (`users`, `subscriptions`) and their migrations. The backend owns every product table (Sources, Chunks, Conversations, messages, Citations), defined as SQLAlchemy models and migrated with Alembic. This matches the existing rule that FastAPI owns the product, keeps the whole product in Python, and makes SQLAlchemy and Alembic part of the backend work.

Two migration tools share one database, so each manages only its own tables:

- Alembic's autogenerate excludes the SaaS tables (an `include_object` filter), or it would try to drop them.
- `drizzle-kit push` is never used, because it can remove tables Drizzle does not know; only `drizzle-kit generate` and `migrate`.
- Product tables may reference `users.id`; the `users` table itself stays Drizzle's.
- SQLAlchemy `create_all()` is still never used: every product table comes from an Alembic migration.

## Considered Options

- Drizzle owns every table (what AGENTS.md said): one migration tool, but every product table would be written in TypeScript, outside the backend that owns the product.

## Consequences

- Replaces the ownership part of ADR 0002: the `chunks` table is created by an Alembic migration, and LangChain's `PGVectorStore` still never creates it.
