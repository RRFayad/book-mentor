# Book Mentor v1 product

- Decided in the product grill (2026-10-01). Terms: [CONTEXT.md](../CONTEXT.md). Decisions: [docs/adr/](adr/).
- **v1:** marks where the first release differs from the plan (updated 2026-11-13).

## Sources

- A **book** (text PDF; scans rejected) or a **blog** (one site's posts, via Tavily). **v1:** books only.
- Title and author required. PDFs prefill both from metadata.
- **Ingesting** (progress bar) → **Ready**. No failed state: a failed add is removed, with a toast.
- Left Ingesting (tab closed) → removed automatically. **v1:** still Ingesting after 15 min → the Library deletes it and says so.
- Deleting an Ingesting Source stops it. No cancel button.
- **Expiry:** 7 days after it's added.
  - Leaves the Library, stops being searched.
  - A daily job deletes its text (Chunks, Notes, One Page).
  - The title stays → its Conversations show "Expired".
  - The UI shows "expires in X days".
- Lives in the Library. Added once, used by any number of Conversations.
- Delete → confirm, with how many Conversations use it → they behave as after Expiry.
  - The text is deleted right away.

## Conversations

- Start: pick 1 to 3 Ready Sources, ask a first question. **v1:** 1 Source.
- Title from the first question; can be renamed. **v1:** the question itself, ≤ 200 chars.
- Can be deleted. The Source set never changes.
- After a Source expires: the Conversation continues and can use passages already cited. Never read-only.
  - **v1:** a question then gets "couldn't find it". Cited passages: v1.1.
- Memory: the last 3 questions and answers.
- History only grows: no editing, regenerating, or branching. Answers can be copied.
- Streaming, with Stop; a stopped answer is kept, marked stopped. **v1:** no streaming, no Stop (#20).
- A failed answer doesn't count toward the limit.

## The Mentor

- Never goes beyond its Sources. Nothing found → says so. No general knowledge.
- Evidence: Chunks of the remaining Sources + passages already cited. Recent messages are context only (ADR 0003).
  - **v1:** Chunks of unexpired Sources. Not covered → searches again, up to 2 times ([retrieval.md](retrieval.md)).
- Notes and the One Page: stated, never cited → "(Chapter 3, pp. 40–52)".
- Answer shape: short direct answer, then the explanation. Markdown: bold, lists, no headings.
- Comparisons (v1.1): each Source's position, agreements, conflicts, what one doesn't address.
- Names Sources by title and author. Answers in the question's language.
- **Citations:** inline markers → a side panel with the cited text, title, author, page. They keep a copy of the text.

## Notes and the One Page

- Why: Chunks miss a section's full outline and the book's big picture.
- **Notes:** one per section, written as each batch arrives. Lists kept whole; every line names its page.
- **One Page:** the Notes reorganized into the book's big picture, once the book is complete.
- Retrieval: the best Notes come with the Chunks; the One Page comes with every question.
- Never cited (ADR 0003).
- Cheap: one model call per batch, one per book, low-cost model.

## Screens

- Chat layout, thread on assistant-ui (ADR 0004).
- Designs: [v2 canvas](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4) → sidebar, New Conversation, Conversation. [v1 canvas](https://claude.ai/artifact/HbV6e1NR4qCuV99cV5rViA) → Library, Add Source, Delete Source, landing page.
- **Sidebar:** New Conversation, Library (with count), Conversations by date, account.
- **New Conversation** (after sign-in): composer, Sources picked like attachments. Empty Library → points to Add Source.
- **Conversation:** centered messages, Source chips in the composer, Citations in a side panel (bottom sheet on mobile).
- **Library:** Sources (kind, state, size, Expiry) and usage. Add Source with progress. Delete with confirmation.
- **Landing page:** tagline, 3-step "how it works", honest limits, sign-up. No pricing.
- Removed from the starter kit: the mock Overview dashboard, Settings.

## Access and limits

- Open sign-up. Costs capped by the AI provider's monthly budget. No kill switch.
- Per user:
  - 3 active Sources;
  - PDFs ≤ 500 pages;
  - 50 messages per rolling 24 h (a question + its answer, all Conversations; "couldn't find it" counts, failed doesn't).
  - **v1:** the UI doesn't say yet when more can be sent.
- Input caps: question ≤ 1,000 chars, page text ≤ 10,000, title/author ≤ 200.

## v1.1

1. **Retrieval check:** judge each passage before answering, drop the irrelevant ones. **v1:** a first step, re-searching when the answer isn't covered.
2. **Comparisons:** 1 to 3 Sources again (#22).

Cut from v1 on 2026-11-12, to ship sooner:

- Streaming (#20).
- Blogs (#21).
- Comparisons (#22).
- Answer verification (#23).

## v2

- Socratic mode, personal profile, EPUB, OCR, web search.
- Bigger blog crawls, editable Source sets, resumable or server-driven ingestion (ADR 0001).
- Re-adding a Source, starter questions, original-PDF viewer, editing, branching.
- Demo Library. **v1:** one demo book, Meditations, is planned for the deploy.
- **Longer memory**, cheapest first: earlier questions verbatim → a Conversation Summary → a tool to read older messages.

## Engineering decisions

- **Settled:**
  - LangGraph flow: queries → retrieve → answer → retry ([retrieval.md](retrieval.md)).
  - Models: `gpt-6-luna` chat, `text-embedding-3-small` embeddings.
  - Expiry cleanup: a daily Vercel Schedule.
  - Thread runtime: assistant-ui's ExternalStoreRuntime (ADR 0004).
  - Message-part contract: the Zod schemas in `packages/shared`.
- **Open (v1.1):** streaming transport (#20), Tavily costs (#21).
