# Book Mentor

[![CI](https://github.com/RRFayad/book-mentor/actions/workflows/ci.yml/badge.svg)](https://github.com/RRFayad/book-mentor/actions/workflows/ci.yml)

- One line: ask your books questions, get answers that cite the exact page.
- Live demo link (after deploy).
- Try it: Meditations is in every account (George Long translation, public domain).

## How it was built: the whole process, not just the code

- From product idea to deployment: one person working as the whole tech team, each role with its own artifact, and building the frontend, the backend, and the AI features.
- **Product:** the product grill and v1 scope ([v1-product.md](docs/v1-product.md)); the glossary ([CONTEXT.md](CONTEXT.md)); the v1 / v1.1 / v2 cut.
- **Design:** the canvases: [v2](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4#page-dcb81aee8d83) for the chat and sidebar, [v1](https://claude.ai/artifact/HbV6e1NR4qCuV99cV5rViA) for the Library and landing page.
  - 🖼️ Screenshot: a canvas next to the built screen.
- **Project management:** [GitHub issues](https://github.com/RRFayad/book-mentor/issues?q=is%3Aissue) as vertical slices with blocking edges (parent [#16](https://github.com/RRFayad/book-mentor/issues/16) → #17…#27); the scope cut on the tickets.
  - 🖼️ Screenshot: the ticket list or a ticket with its "Blocked by".
- **Architecture:** the ADRs ([docs/adr/](docs/adr/)); the [API contract](docs/api-contract.md); the [data model](docs/data-model.md); [retrieval](docs/retrieval.md).
- **Code:** frontend (Next.js chat app), backend (Fastify API, Postgres), and AI (RAG, LangGraph Mentor, evals), in one monorepo with conventions in [AGENTS.md](AGENTS.md).
- **QA:** API tests against a real Postgres; [CI](.github/workflows/ci.yml) on every PR; an [eval set](backend/evals/) for answer quality.
- Built with Claude Code as a pair: say how, and what was kept as my own decisions.

## Links to every artifact

- **Product:** [v1 product](docs/v1-product.md) · [glossary (CONTEXT.md)](CONTEXT.md)
- **Design:** [v2 canvas (chat, sidebar)](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4#page-dcb81aee8d83) · [v1 canvas (Library, landing page)](https://claude.ai/artifact/HbV6e1NR4qCuV99cV5rViA)
- **Tickets:** [all issues](https://github.com/RRFayad/book-mentor/issues?q=is%3Aissue)
  - Frontend first, on mock data: [#1 parent](https://github.com/RRFayad/book-mentor/issues/1) → [#2 App home route](https://github.com/RRFayad/book-mentor/issues/2) · [#3 Chat shell](https://github.com/RRFayad/book-mentor/issues/3) · [#4 Library page](https://github.com/RRFayad/book-mentor/issues/4) · [#5 Conversation thread](https://github.com/RRFayad/book-mentor/issues/5) · [#6 Add Source](https://github.com/RRFayad/book-mentor/issues/6) · [#7 Delete Source](https://github.com/RRFayad/book-mentor/issues/7) · [#8 Answer sections and Citations](https://github.com/RRFayad/book-mentor/issues/8) · [#9 Mock streaming](https://github.com/RRFayad/book-mentor/issues/9) · [#10 Citation panel](https://github.com/RRFayad/book-mentor/issues/10) · [#11 New Conversation](https://github.com/RRFayad/book-mentor/issues/11) · [#12 Expiry in a Conversation](https://github.com/RRFayad/book-mentor/issues/12) · [#13 Rename and delete](https://github.com/RRFayad/book-mentor/issues/13) · [#14 Mock data](https://github.com/RRFayad/book-mentor/issues/14)
  - Then the backend that made it real: [#16 parent](https://github.com/RRFayad/book-mentor/issues/16) → [#17 Your Library is saved](https://github.com/RRFayad/book-mentor/issues/17) · [#18 A book becomes ready](https://github.com/RRFayad/book-mentor/issues/18) · [#19 Ask and get a cited answer](https://github.com/RRFayad/book-mentor/issues/19) · [#24 Conversations are remembered](https://github.com/RRFayad/book-mentor/issues/24) · [#25 Limits are real](https://github.com/RRFayad/book-mentor/issues/25) · [#26 Sources expire](https://github.com/RRFayad/book-mentor/issues/26) · [#27 Manage for real](https://github.com/RRFayad/book-mentor/issues/27)
  - Moved to later: [#20 Streaming](https://github.com/RRFayad/book-mentor/issues/20) · [#21 Blogs](https://github.com/RRFayad/book-mentor/issues/21) · [#22 Compare Sources](https://github.com/RRFayad/book-mentor/issues/22) · [#23 Never invent](https://github.com/RRFayad/book-mentor/issues/23) · [#33 Small improvements](https://github.com/RRFayad/book-mentor/issues/33)
- **Architecture decisions (ADRs):**
  - [0001: Browser extracts PDF text and drives batched ingestion](docs/adr/0001-browser-extracts-pdf-text-and-drives-batched-ingestion.md)
  - [0002: Drizzle-owned chunks table, searched exactly per book](docs/adr/0002-drizzle-owned-chunks-table.md)
  - [0003: Cited passages are evidence; summaries are not](docs/adr/0003-cited-passages-are-evidence-summary-is-not.md)
  - [0004: assistant-ui for the Conversation thread](docs/adr/0004-assistant-ui-for-the-conversation-thread.md)
  - [0005: The backend owns the product tables](docs/adr/0005-backend-owns-product-tables.md)
  - [0006: One Drizzle schema for every table](docs/adr/0006-one-drizzle-schema-for-every-table.md)
- **Contracts and design docs:** [API contract](docs/api-contract.md) · [data model](docs/data-model.md) · [retrieval](docs/retrieval.md)
- **QA:** [CI workflow](.github/workflows/ci.yml) · [eval set and script](backend/evals/)

# The project

## What it does

- System diagram (Mermaid): browser (reads the PDF) → Next.js (Clerk) → Fastify API → Postgres + pgvector; OpenAI and LangSmith on the side; Vercel around it.

- Add a PDF book → it's read in the browser, indexed, and Ready in about a minute.
  - 🖼️ GIF: Add Source → progress bar → Ready.
- Ask questions → answers from the book only, with Citations to the page.
- Says plainly when the book doesn't cover something, instead of making it up.
- Applies the book to your situation ("What would Marcus say about road rage?").
- Remembers the last 3 exchanges, for follow-ups.

## The Mentor (the AI part)

- Diagram: `writeSearchQueries → retrieveFromSources → writeAnswer → (retry?)` (Mermaid, renders on GitHub).
- Ingestion: browser extracts text → chunks → embeddings → Notes per section → One Page per book.
- The RAG tree: chunks (the book's words) → Notes (sections) → One Page (the whole book).
- Only passages are cited; Notes and the One Page are the Mentor's understanding ([ADR 0003](docs/adr/0003-cited-passages-are-evidence-summary-is-not.md)).
- Citations are enforced in code, not only asked of the model.
- Corrective retries: not covered and not off-topic → search again with different queries.
- Tracing with LangSmith: one Thread per Conversation.
  - 🖼️ Screenshot: a trace showing a retry (two search tries, then the answer).

## What I measured, and what changed

- **The eval:** 33 questions with expected answers and pages, including 4 the book doesn't cover; a report per run.
- **Only objective numbers:** 26 of 29 answers point to a page that holds the answer; 4 of 4 not-covered questions answered with "couldn't find it".
- **The LLM grader proved unreliable** for fine distinctions, so I read every answer it didn't mark correct instead of publishing its counts. Improving the grader is planned ([#38](https://github.com/RRFayad/book-mentor/issues/38)).
- **Story: the One Page steers the search** ("road rage" → "anger at others' wrongs").
- **Story: the retry arc** on one stubborn question: keyword queries 1/5 → sentence queries 3/5 → varied retries 10/10.
- **Story: the vector index bug:** HNSW filtered by book after ranking → exact search per book.
- **Known limit:** Christians (p. 99) is never found → chunk size and hybrid search (next).
- Framing: lead with the method; keep automated and manual numbers apart; link a real report.

## Limits, privacy, and costs

- 3 active books; 50 messages per rolling 24 hours; input caps.
- A book's text is deleted 7 days after it's added (daily scheduled job); its title stays in old Conversations.
- The PDF never leaves the browser; only its text is sent.
- Costs capped by the AI provider's monthly budget.
- Prompt injection: what holds (system rules, structured output, book-only answers) and what's still a risk (instructions inside a PDF).

## Tech stack

- Frontend: Next.js, assistant-ui, Tailwind, shadcn/ui, Clerk.
- API: Fastify, Zod contract shared with the frontend.
- AI: LangChain + LangGraph, OpenAI chat and embeddings, LangSmith.
- Data: PostgreSQL + pgvector, Drizzle.
- Infra: Vercel (two projects + a daily Schedule), Supabase Postgres, GitHub Actions.

## Deployment

- Two Vercel projects: the Next.js app and the API (esbuild bundle).
- Supabase Postgres with pgvector; Drizzle migrations.
- A daily Vercel Schedule deletes expired books' text, secured by `CRON_SECRET`.
- CI must pass before merging to `main`.

## Run it locally

- Prerequisites: Node 26, Docker, Clerk and OpenAI keys.
- Env files: `frontend/.env.local` and `backend/.env` (incl. `CRON_SECRET`).
- `npm install` → `npm run db:migrate` → `npm run dev`.
- Tests: `npm run check` (Docker running); the eval: `npm run eval -w @app/backend`.
- Decide: keep the detailed setup here, or move it to `docs/setup.md`.

## Project structure

- `frontend/`, `backend/`, `packages/shared/`, `docs/`, `backend/evals/`.

## What's next

- v1.1: streaming with a real Stop, hybrid search, comparing books, answer verification, blogs.
- v2: Socratic mode, longer memory, EPUB/OCR.

## Built on

- My [SaaS starter kit](https://github.com/RRFayad/saas-starter-kit): auth, billing, the API scaffold; what's new in Book Mentor.

## About me

- Name, LinkedIn, and open to Full Stack AI Engineer roles.
