# Data model

How the backend stores Book Mentor's data in Postgres. Words follow
[CONTEXT.md](../CONTEXT.md). What the screens receive is a different shape:
see [api-contract.md](api-contract.md).

- **Ownership (ADR 0006):** every table, SaaS and product, is in the one
  Drizzle schema in `packages/shared/src/db/schema.ts`, migrated with
  `npm run db:generate` and `npm run db:migrate`. Next.js writes `users` and
  `subscriptions`; the API writes the tables below.
- **Built one feature at a time:** each table is created by the ticket that
  needs it. Columns not marked "built" are a plan, decided in that ticket.

## Overview

```
users (Drizzle) ──┬─< sources ──< chunks
                  └─< conversations ──< messages
                         └─< conversation_sources >── sources
```

## Tables

| Table                    | Key columns                                                                                                                                                                                                                                                                | Ticket |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **sources**              | `id` (UUID), `user_id` → users, `kind` (book or blog), `title`, `author`, `page_count` (books), `post_count` and `address` (blogs), `state` (ingesting or ready), `ingestion_progress`, `created_at`, `expires_at` (7 days after creation; the expiry job deletes past it) | #17    |
| **chunks**               | `id`, `source_id` → sources, `text`, `page` (books) or `post_title` and `post_url` (blogs), `embedding` (1536 numbers, pgvector)                                                                                                                                           | #18    |
| **conversations**        | `id` (UUID), `user_id` → users, `title`, `summary` (rolling summary), `created_at`, `last_activity_at`                                                                                                                                                                     | #19    |
| **conversation_sources** | `conversation_id` → conversations, `source_id` → sources (empty once deleted), a copy of the Source's `title`, `author`, `kind`                                                                                                                                            | #19    |
| **messages**             | `id` (UUID, chosen by the browser), `conversation_id` → conversations, `role` (user or mentor), `text` (user), `status`, `parts` and `citations` (mentor, JSON), `created_at`                                                                                              | #19    |

- **chunks is the vector store.** LangChain's `PGVectorStore` reads and writes
  it; the Alembic migration creates it (ADR 0002, ADR 0005).
- **Answer parts and Citations are JSON in `messages`.** They are always read
  with their answer and never searched on their own. Each Citation keeps a
  copy of its quoted text (ADR 0003).
- **Conversations and Sources are many-to-many:** a Conversation uses 1 to 3
  Sources, and a Source can be in many Conversations. `conversation_sources`
  links them.

## When a Source is deleted or expires

| Table                | What happens                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| sources              | the row is deleted                                                                                                         |
| chunks               | deleted with it (`ON DELETE CASCADE`): search no longer finds it                                                           |
| conversation_sources | the row stays; `source_id` becomes empty (`ON DELETE SET NULL`); the copied title and author keep the "Expired" chip named |
| messages             | unchanged: Citations keep their copied text, so old answers stay checkable                                                 |

Deleting a user deletes their Sources, Conversations, and everything under
them (`ON DELETE CASCADE` from `users`).
