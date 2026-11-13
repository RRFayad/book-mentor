# Data model

- How the backend stores data in Postgres. Terms: [CONTEXT.md](../CONTEXT.md).
- What the screens receive: [api-contract.md](api-contract.md).
- One Drizzle schema for every table: `packages/shared/src/db/schema.ts` (ADR 0006).
  - Change it → `npm run db:generate` → `npm run db:migrate`.
  - Next.js writes `users`, `subscriptions`; the API writes the rest.

## Overview

```
users ──┬─< sources ──┬─< chunks
        │             └─< notes
        └─< conversations ──< messages
               └─< conversation_sources >── sources
```

## Tables

| Table                    | Key columns                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **sources**              | `user_id`, `kind`, `title`, `author`, `page_count`, `one_page`, `state` (ingesting / ready), `ingestion_progress`, `expires_at` (+7 days) |
| **chunks**               | `source_id`, `page` (where it starts), `content`, `embedding` (1536, `text-embedding-3-small`)                                            |
| **notes**                | `source_id`, `heading`, `first_page`, `last_page`, `content`, `embedding`                                                                 |
| **conversations**        | `user_id`, `title` (first question, ≤ 200 chars), `last_activity_at`                                                                      |
| **conversation_sources** | `conversation_id`, `source_id`                                                                                                            |
| **messages**             | `id` (from the browser), `conversation_id`, `role`, `text` (questions), `status`, `parts` + `citations` (answers, JSON)                   |

- **chunks = the vector store:** Drizzle, one book per search, no index (ADR 0002).
- **Expired = computed:** `expires_at` in the past. `state` stays `ready`.
- **Citations keep a copy** of the quoted text (ADR 0003).
- **Conversations ↔ Sources:** many-to-many. 1 Source per Conversation in v1.
- **Message limit:** answers in the last 24 h, not failed, all Conversations.

## When a Source expires

- Leaves the Library, stops being searched.
- Daily job (`GET /cron/delete-expired-sources`):
  - deletes `chunks`, `notes`;
  - clears `one_page`;
  - keeps the `sources` row → Conversations show "Expired".
- Messages unchanged: Citations still readable.

## When a Source is deleted

- Deleting = expiring now: `expires_at` → now.
- Its `chunks`, `notes`, `one_page` are deleted right away.
- The row stays → its Conversations show it as "Expired".
- Batches still arriving → `404`; the daily job removes any that slipped in.

## When a user is deleted

- Everything under them is deleted (cascade from `users`).
