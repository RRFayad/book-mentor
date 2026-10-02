# Book Mentor v1 product

Settled in the product grill on 2026-10-01. Target: ship within about two weeks.
Terms follow [CONTEXT.md](../CONTEXT.md); architectural decisions live in [docs/adr/](adr/).

## Sources

- A Source is a **book** (text-based PDF; scanned PDFs are rejected) or a **blog**
  (posts from one site, fetched through Tavily). A whole blog is one Source.
- Every Source has a required **title** and **author**. PDFs prefill both from
  file metadata; blogs are entered by hand.
- States: **Ingesting** (with a progress bar) → **Ready**. There is no failed
  state: if adding fails, the Source is removed and an error toast tells the
  user to try again. A Source left Ingesting (e.g. the tab was closed) is
  removed automatically. Deleting an Ingesting Source stops its ingestion, so
  there is no separate cancel action.
- **Expiry**: Sources and their Chunks are deleted 7 days after being added. The
  UI shows "expires in X days".
- A Source lives in the Library, not in a Conversation: it is added once and
  any number of Conversations can use it.
- Deleting a Source by hand asks for confirmation and says how many
  Conversations use it. Those Conversations then behave exactly as after
  Expiry.

## Conversations

- Started by picking **1 to 3 Ready Sources** and asking a first question; the
  title is generated from that question and can be renamed. Conversations can
  be deleted. The Source set never changes.
- When a Source expires, the Conversation continues; the Mentor says plainly
  when a question needs the expired Source. Even with no Sources left, the
  Conversation stays open: it can still use passages already cited in it.
  Conversations never expire on their own and are never read-only.
- Memory: recent messages verbatim plus a rolling summary of older ones.

## The Mentor

- Never invents anything beyond its Sources. When nothing relevant is found, it
  says so plainly, with no general-knowledge fallback.
- Its evidence is the Chunks of the Conversation's remaining Sources plus the
  passages already cited in the Conversation. The rolling summary and message
  history are context only, never evidence (see ADR 0003).
- Answers open with **What the Source says** (with Citations). **What it means**
  and **How to apply it** are added only when they help. Practical lookups don't
  get them.
- **Comparison** answers give each Source's position, then agreements,
  conflicts, and what a Source does not address.
- Refers to Sources by author and title. Answers in the language of the
  question; Citations keep the original text.
- **Citations** are inline markers that open a side panel showing the cited text,
  title, author, and page (book) or post link (blog). They keep a copy of the
  text, so they still work after Expiry.

## Screens

The app uses a chat layout (like Claude or ChatGPT) instead of the starter
kit's page-and-cards shell. Design: [Book Mentor v1 canvas](https://claude.ai/artifact/HbV6e1NR4qCuV99cV5rViA).

- **Sidebar**: New Conversation, Library (with active Source count), then the
  Conversations grouped by date, account at the bottom.
- **New Conversation** (the screen after sign-in): a centered composer where
  Sources are picked from the Library like attachments, then the first question
  is asked. An empty Library shows an empty state pointing to Add Source.
- **Conversation**: centered message column; the Conversation's Sources stay as
  fixed chips in the composer; Citations open in a right-side panel (a bottom
  sheet on mobile).
- **Library**: Sources and usage on one screen. Sources with kind, state, size,
  and Expiry; Add Source (PDF or blog) with ingestion progress; delete with
  confirmation.
- **Landing page**: minimal. Hero with tagline, three-step "how it works",
  honest limits and Expiry, sign-up. No pricing. Built last; cut first.

The starter kit's mock Overview dashboard and the Settings nav section are
removed.

## Access and limits

- Open sign-up, plus a global kill switch that disables new Sources and messages.
- Per user: 3 active Sources, PDFs up to 500 pages, blogs up to 20 posts,
  50 messages per rolling 24 hours (the UI shows when more can be sent).
  Numbers may be tuned during implementation.
- Proposed, not yet confirmed: replace the page and post limits with one text
  size limit per Source (about a 500-page book), taking a blog's newest posts
  first. Depends on Tavily credit costs and whether post dates are available.

## Deferred to v2

Socratic mode, personal profile for applications, EPUB, OCR, web search in
chat, larger or refreshing blog crawls, editable Source sets, resumable
ingestion, re-adding a Source to an existing Conversation, suggested starter
questions, preloaded demo Library, original-PDF viewer.

## Open engineering questions

To settle in a second grill before tickets: the LangGraph flow (retrieve,
reflect, decide, compare), chat streaming transport, chat model, Tavily
endpoints and credit costs, and how Expiry cleanup is scheduled.
