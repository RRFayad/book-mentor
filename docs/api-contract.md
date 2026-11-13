# API contract

- The API the screens use. Terms: [CONTEXT.md](../CONTEXT.md).
- Shapes: the Zod schemas in [`packages/shared/src/schemas/`](../packages/shared/src/schemas/).
- Storage: [data-model.md](data-model.md).
- Live docs: `/docs` on the running API (OpenAPI).

## Conventions

- JSON in `camelCase`. Times: ISO 8601, UTC. IDs: UUIDs.
- Every request: `Authorization: Bearer <Clerk session token>`. The user comes from the token, never the body.
- Only your own data. Another reader's item → `404`.
- Errors are `{ detail }`:
  - `401` not signed in;
  - `404` not found;
  - `409` conflict: `limit-reached`, message id reused, book no longer Ingesting;
  - `422` invalid input: `too-large` (> 500 pages), text over the caps.

## Sources

| Endpoint                      | Request                                      | Response                      |
| ----------------------------- | -------------------------------------------- | ----------------------------- |
| `GET /sources`                |                                              | `Source[]` (not expired)      |
| `POST /sources`               | `{ kind: "book", title, author, pageCount }` | `{ status: "added", source }` |
| `POST /sources/{id}/pages`    | `{ pages: { page, text }[] }`                | `{ ingestionProgress }`       |
| `POST /sources/{id}/complete` |                                              | `Source` (Ready)              |
| `DELETE /sources/{id}`        |                                              | `204`                         |

Adding a book (ADR 0001):

1. The browser reads the PDF; a scan is rejected there. The file is never sent.
2. `POST /sources` → Ingesting.
   - > 500 pages → `422`. 4th active book → `409`. Title, author ≤ 200 chars.
3. `POST /pages`: batches of 25 pages, 3 at a time. Page text ≤ 10,000 chars. A batch sent again replaces itself.
4. `POST /complete` → writes the One Page → Ready. Only once (`409` after).

Not built yet:

- `GET /sources/conversation-counts`, for the Delete dialog (#27).
- Blogs (#21): `kind: "blog"` → `422`.

## Conversations and messages

| Endpoint                            | Request                             | Response                                |
| ----------------------------------- | ----------------------------------- | --------------------------------------- |
| `GET /conversations`                |                                     | `ConversationListItem[]`                |
| `GET /conversations/{id}`           |                                     | `Conversation` (Sources, messages)      |
| `POST /conversations`               | `{ sourceIds, firstQuestion }`      | `{ status: "created", conversationId }` |
| `PATCH /conversations/{id}`         | `{ title }`                         | `ConversationListItem`                  |
| `DELETE /conversations/{id}`        |                                     | `204`                                   |
| `POST /conversations/{id}/messages` | `{ userMessageId, answerId, text }` | `{ status: "answered", answer }`        |
| `GET /conversations/message-usage`  |                                     | `{ max, usage }`                        |

- **New Conversation:** Ready, unexpired Sources. Title = first question, ≤ 200 chars.
- **Message ids** come from the browser → messages show before the reply.
- **Sending:**
  - question ≤ 1,000 chars;
  - 50 answers in 24 h → `409 limit-reached`;
  - a failed answer is saved as `error`, doesn't count.
- **An answer:** `parts` (text with Citation markers, or "not covered") + `citations` (numbered from 1, with quoted text).
- **`message-usage`:** answers in 24 h, not failed. The frontend adds the Source count.
- **No streaming** yet (#20): the whole answer at once.

## Scheduled jobs

| Endpoint                           | Request                               | Response              |
| ---------------------------------- | ------------------------------------- | --------------------- |
| `GET /cron/delete-expired-sources` | `Authorization: Bearer <CRON_SECRET>` | `{ deletedPassages }` |

- Called daily by a Vercel Schedule (`backend/vercel.json`).
- Deletes expired books' text; keeps the Source row.
- No secret → `401`.
