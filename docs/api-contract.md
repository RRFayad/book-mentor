# API contract

The backend API the screens use. Words follow [CONTEXT.md](../CONTEXT.md).
Response shapes are the TypeScript types in
[`src/lib/backend/types.ts`](../src/lib/backend/types.ts).

- **Fixed:** the screens already rely on it. Changing it means changing the
  screens too.
- **Proposed:** a starting point. The developer confirms or changes it at the
  ticket's "decide" step, then updates this file.

## Conventions

| Rule | Status |
|---|---|
| JSON uses `camelCase` field names, exactly as in `types.ts`. In Pydantic: `alias_generator=to_camel` and `populate_by_name=True`. | Fixed |
| Times are ISO 8601 strings in UTC, like `2026-10-06T14:00:00Z`. | Fixed |
| IDs of Sources, Conversations, and messages are strings. Use UUIDs. | Fixed |
| Every request sends `Authorization: Bearer <Clerk session token>`. The user is read from the verified token, never from the request body. | Fixed |
| A request can only see and change the signed-in user's own data. | Fixed |
| Expected outcomes (rejected, limit reached) return a normal body with a `status` field, like `AddSourceResult`. HTTP errors are only for: 401 not signed in, 403 no subscription, 404 not found, 422 invalid input. | Proposed |

## Sources

| Endpoint | Request | Response | Status |
|---|---|---|---|
| `GET /sources` | | `Source[]` | Proposed |
| `POST /sources` | book: `{ kind, title, author, pageCount }`; blog: `{ kind, address, title, author }` | `AddSourceResult` | Proposed |
| `POST /sources/{id}/pages` | `PageBatch` (below) | `{ ingestionProgress: number }` | Proposed |
| `POST /sources/{id}/complete` | | `Source` (now Ready) | Proposed |
| `DELETE /sources/{id}` | | `204` | Proposed |
| `GET /sources/conversation-counts` | | `Record<sourceId, number>` | Proposed |

**Adding a book (ADR 0001).** The browser reads the PDF. The server never
receives the file.

1. `POST /sources` with the page count. The Source is created as Ingesting.
   More than 500 pages: `{ status: "rejected", reason: "too-large" }`.
2. `POST /sources/{id}/pages`, once per batch of about 25 pages, in order.
3. `POST /sources/{id}/complete`. The Source becomes Ready.

A batch where no page has text means the PDF is a scan:
`{ status: "rejected", reason: "scanned" }`, and the Source is removed.

```ts
// Proposed. Add to types.ts when ticket "A book becomes ready" starts.
type PageBatch = {
  pages: { page: number; text: string }[]; // page numbers start at 1
};
```

**Adding a blog.** The server fetches the posts itself; how (Tavily, batches,
limits) is decided in ticket "Add a blog".

## Conversations and messages

| Endpoint | Request | Response | Status |
|---|---|---|---|
| `GET /conversations` | | `ConversationSummary[]` | Proposed |
| `GET /conversations/{id}` | | `Conversation` | Proposed |
| `POST /conversations` | `{ sourceIds: string[], firstQuestion: string }` | `CreateConversationResult` | Proposed |
| `PATCH /conversations/{id}` | `{ title: string }` | `ConversationSummary` | Proposed |
| `DELETE /conversations/{id}` | | `204` | Proposed |
| `POST /conversations/{id}/messages` | `NewMessage` (without `conversationId`, which is in the path) | `SendMessageResult` | Proposed |

- `CreateConversationResult` lives in the Conversations server actions today.
  Move it into `types.ts` when ticket "Ask and get a cited answer" starts.
- The client chooses the message ids (`userMessageId`, `answerId`), so it can
  show the messages before the reply arrives.
- An answer is a `MentorAnswer`: ordered `parts` (sections, positions, not
  covered, text) whose `RichText` holds Citation markers, and `citations`
  numbered from 1 inside each answer. Every Citation keeps its quoted text
  (ADR 0003).

**Streaming** (ticket "Answers appear as they're written"). Open: the stream
format, which assistant-ui runtime the thread keeps, and how Stop reaches the
server. Until then, `POST /conversations/{id}/messages` returns the whole
answer at once.

## Usage

| Endpoint | Request | Response | Status |
|---|---|---|---|
| `GET /usage` | | `Usage` | Proposed |

Limits: 3 active Sources; 50 messages in the last 24 hours, not counting
messages whose answer failed. The tested rule the screens use is in
`src/lib/usage/message-allowance.ts`; the backend must give the same result.
