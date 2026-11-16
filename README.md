# Book Mentor

[![CI](https://github.com/RRFayad/book-mentor/actions/workflows/ci.yml/badge.svg)](https://github.com/RRFayad/book-mentor/actions/workflows/ci.yml)

Ask your books questions, get answers that cite the exact page.

- Demo book: Meditations by Marcus Aurelius (public domain), shared with every account.

## How it was built: the whole process, not just the code

I built Book Mentor as a one-person tech team, from the product idea to deployment: product, design, project management, architecture, frontend, backend, AI, and QA. Claude Code was my assistant throughout; the decisions stayed mine, and I reviewed every change. The work followed spec-driven development: each feature started as a written spec and tickets before any code, and CI checks every pull request.

- **Product:**
  - [Product requirements](docs/v1-product.md): decided in a product grill; the v1 scope, then v1.1 and v2.
  - [Domain glossary](CONTEXT.md)
- **Design:** a [design canvas](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4) for the chat and sidebar.
- **Project management:** [GitHub issues](https://github.com/RRFayad/book-mentor/issues?q=is%3Aissue) as vertical slices with blocking edges; the scope cut recorded on the tickets.
- **Architecture:**
  - [Decision records (ADRs)](docs/adr/)
  - [API endpoints and payloads](docs/api-contract.md)
  - [Database tables](docs/data-model.md)
  - [How the Mentor searches and answers](docs/retrieval.md)
- **Code:** frontend (Next.js chat app), backend (Fastify API, Postgres), and AI (RAG, LangGraph Mentor, evals), in one monorepo with conventions in [AGENTS.md](AGENTS.md).
- **QA:**
  - API tests against a real Postgres
  - [CI: lint, types, and tests on every PR](.github/workflows/ci.yml)
  - [Answer-quality eval: questions and script](backend/evals/)

## Links to every artifact

- **Product:**
  - [Product requirements](docs/v1-product.md)
  - [Domain glossary](CONTEXT.md)
- **Design:** [design canvas](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4)
- **Tickets:** [all issues](https://github.com/RRFayad/book-mentor/issues?q=is%3Aissue)
- **Architecture decisions (ADRs):**
  - [0001: PDFs are read in the browser and sent in batches](docs/adr/0001-browser-extracts-pdf-text-and-drives-batched-ingestion.md)
  - [0002: Book passages in a Drizzle table, searched exactly per book](docs/adr/0002-drizzle-owned-chunks-table.md)
  - [0003: Only cited passages count as evidence](docs/adr/0003-cited-passages-are-evidence-summary-is-not.md)
  - [0004: assistant-ui for the chat thread](docs/adr/0004-assistant-ui-for-the-conversation-thread.md)
  - [0005: The backend owns the product tables (replaced by 0006)](docs/adr/0005-backend-owns-product-tables.md)
  - [0006: One database schema for every table](docs/adr/0006-one-drizzle-schema-for-every-table.md)
- **Contracts and design docs:**
  - [API endpoints and payloads](docs/api-contract.md)
  - [Database tables](docs/data-model.md)
  - [How the Mentor searches and answers](docs/retrieval.md)
- **QA:**
  - [CI: lint, types, and tests on every PR](.github/workflows/ci.yml)
  - [Answer-quality eval: questions and script](backend/evals/)

# The project

## What it does

- Add a PDF book → it's read in the browser, indexed, and Ready in about a minute.
- Ask questions → answers from the book only, with Citations to the page.
- Says plainly when the book doesn't cover something, instead of making it up.
- Applies the book to your situation ("What would Marcus say about road rage?").
- Remembers the last 3 exchanges, for follow-ups.

## The Mentor (the AI part)

- Ingestion: browser extracts text → chunks → embeddings → Notes per section → One Page per book.
- The RAG tree: chunks (the book's words) → Notes (sections) → One Page (the whole book).
- Only passages are cited; Notes and the One Page are the Mentor's understanding ([ADR 0003](docs/adr/0003-cited-passages-are-evidence-summary-is-not.md)).
- Citations are enforced in code, not only asked of the model.
- Corrective retries: not covered and not off-topic → search again with different queries.
- Tracing with LangSmith: one Thread per Conversation.

## Answer quality

- **The eval:** 29 questions with known answers, plus 4 the book doesn't cover; 2 runs.
- **Answered correctly:** 28/29 and 29/29.
  - 7–8 per run were marked "partial" by the automated grader, and correct after human review (each left out one detail). A better grader is planned ([#38](https://github.com/RRFayad/book-mentor/issues/38)).
  - The one miss: a very specific question, mentioned in a single line of the book.
- **Never pretends:** 4/4 questions the book doesn't cover → "couldn't find it".

## Improving the RAG

- **One stubborn question,** found more often at each step: keyword queries 1/5 → sentence queries 3/5 → varied retries 10/10.
- **The One Page steers the search:** situations the book never names → its own ideas ("road rage" → "anger at others' wrongs").
- **Filtered vector search:** an approximate index ranks all books, then filters by book → can drop the right passages → exact search per book.
- **Search strategy chosen by measurement:** 4 options compared on the same questions.
- **Smaller refinements:** prompt reviews, flow and search fixes along the way.
- Details: [How the Mentor searches and answers](docs/retrieval.md#how-retrieval-improved).

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

## Project structure

- `frontend/`, `backend/`, `packages/shared/`, `docs/`, `backend/evals/`.

## What's next

- v1.1: streaming with a real Stop, hybrid search, comparing books, answer verification, blogs.
- v2: Socratic mode, longer memory, EPUB/OCR.

## Built on

- My [SaaS starter kit](https://github.com/RRFayad/saas-starter-kit): auth, billing, the API scaffold.

## About me

- **Renan Fayad:** Frontend / Full Stack Engineer, building AI applications (RAG, agents) across TypeScript and Python.
- 3+ years in software; most recently at Helios AI, an agriculture forecasting startup: end-to-end projects in large-scale data visualization, performance, and data integration.
- Before that, 13 years in technology innovation consulting: R&D initiatives and multidisciplinary teams for XP Inc. and Mercado Libre → I bridge technology, business, and product.
- Open to Full Stack AI Engineer roles.
- [LinkedIn](https://www.linkedin.com/in/rfayad/) · [GitHub](https://github.com/RRFayad) · renan.r.fayad@gmail.com
