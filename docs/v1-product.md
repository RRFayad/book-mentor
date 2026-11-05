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

- Started by picking **1 to 3 Ready Sources** (1 in the first release; see
  v1.1 below) and asking a first question; the title is generated from that
  question and can be renamed. Conversations can be deleted. The Source set
  never changes.
- When a Source expires, the Conversation continues; the Mentor says plainly
  when a question needs the expired Source. Even with no Sources left, the
  Conversation stays open: it can still use passages already cited in it.
  Conversations never expire on their own and are never read-only.
- Memory: recent messages verbatim plus a rolling summary of older ones.
- History only grows: messages can't be edited, answers can't be regenerated,
  and there is no branching. A streaming answer can be stopped, and answers can
  be copied.
- A stopped answer stays in the history, marked as stopped, with the Citations
  it already had. An answer that fails with an error does not count toward the
  message limit.

## The Mentor

- Never invents anything beyond its Sources. When nothing relevant is found, it
  says so plainly, with no general-knowledge fallback.
- Its evidence is the Chunks of the Conversation's remaining Sources plus the
  passages already cited in the Conversation. The rolling summary and message
  history are context only, never evidence (see ADR 0003).
- It may state what its Notes and the One Page conclude, saying so in the
  answer ("From my notes on Workout Two, pp. 176–186: …", "From my reading of
  the whole book: …"). They are never cited.
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

## Notes and the One Page

Chunks alone miss two kinds of questions: a section's outline, like a
workout's full exercise list, is spread over several Chunks that retrieval
returns only in part; and the big picture ("What is the book's main
argument?") is in no single passage.

- **Notes**: as each batch of pages arrives, the Mentor writes a Note for each
  chapter or major section in it, the way a reader takes study notes. Every
  list is kept whole, and every line names its page. A section cut by a batch
  boundary gets a Note in each batch.
- **One Page**: when the book is complete, the Mentor reorganizes its Notes
  into the book's big picture, which can run longer than a page.
- The best-matching Notes are retrieved alongside the Chunks; the One Page goes
  with every question.
- Both are the Mentor's understanding, not Source text, so they are never cited
  (ADR 0003).
- They must stay cheap and fast: one model call per batch for Notes and one per
  book for the One Page, on a low-cost model, without slowing ingestion
  noticeably.

## Screens

The app uses a chat layout (like Claude or ChatGPT) instead of the starter
kit's page-and-cards shell, with the Conversation thread built on assistant-ui
(ADR 0004). Designs: the [v2 canvas (assistant-ui)](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4)
is the reference for the sidebar, New Conversation, and Conversation screens;
the [v1 canvas](https://claude.ai/artifact/HbV6e1NR4qCuV99cV5rViA) remains the
reference for Library, Add Source, Delete Source, and the landing page.

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

## Next after the first release (v1.1)

The first release answers from one Source per Conversation, in a plain
retrieve-then-answer flow, so it can ship fast. In priority order:

1. **Retrieval check.** Before answering, the Mentor checks each retrieved
   passage against the question, and drops the ones that don't answer it (for
   example, a beginner routine retrieved for a question about the main
   training rule). If none remain, it searches again or says the Sources don't
   cover it.
   The One Page gives it the book's context to judge passages with.
2. **Comparisons.** Conversations go back to 1 to 3 Sources, with the
   Comparison answers described in The Mentor.

## Deferred to v2

Socratic mode, personal profile for applications, EPUB, OCR, web search in
chat, larger or refreshing blog crawls, editable Source sets, resumable
ingestion, server-driven ingestion (direct-to-storage upload plus a background
job queue, so closing the tab no longer stops it; ADR 0001), re-adding a Source
to an existing Conversation, suggested starter questions, preloaded demo
Library, original-PDF viewer, editing or regenerating messages, branching
Conversations.

## Open engineering questions

To settle in a second grill before tickets: the LangGraph flow (retrieve,
reflect, decide, compare), chat streaming transport, chat model, Tavily
endpoints and credit costs, and how Expiry cleanup is scheduled. With
assistant-ui (ADR 0004), also: which custom-backend runtime the thread uses
(ExternalStoreRuntime, or the AI SDK runtime fed by a FastAPI stream), and the
message-part contract for answer sections and Citations that both the stream
and the UI share.
