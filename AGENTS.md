# Project Guidelines

## Scope and Workflow

- Prefer simple, understandable architecture over abstractions introduced for
  hypothetical future needs.
- Do not expand the starter-kit scope or make unrelated changes.
- Do not create branches, stage files, or commit unless explicitly requested.
- Inspect the existing implementation before changing code. Preserve established
  naming, structure, and patterns when they are already clear.

## Architecture Boundaries

- The repository is an npm workspaces monorepo: the Next.js app in
  `frontend/` (`@app/frontend`), the Fastify API in `backend/`
  (`@app/backend`), and the shared package in `packages/shared/`
  (`@app/shared`). The root holds only what spans them: the workspace
  scripts, `docker-compose.yml`, ESLint, and Prettier.
- The Next.js app (`frontend/`) uses a Next.js version with breaking changes
  from common training data. Read `frontend/AGENTS.md` and the guides in
  `node_modules/next/dist/docs/` before writing Next.js code.
- Next.js owns UI, Clerk authentication, Clerk and Stripe webhooks, billing,
  and SaaS/account concerns.
- The API (Fastify) owns product/domain APIs and future product logic, such as
  AI, RAG, agents, and streaming.
- `@app/shared` holds what both apps must agree on: the Drizzle schema and
  migrations, the API contract (Zod schemas in `schemas.ts`), and shared
  constants, types, and utils. Each app reads its own environment variables;
  configuration objects such as `featureFlags` stay in their app.
  Types inferred from a schema live next to it: row types (`User`,
  `Subscription`) in `db/schema.ts`, API types in `schemas.ts`; `types.ts`
  holds shared types that don't belong to a schema file.
- PostgreSQL is the shared application database. Supabase, when used, is only
  the database host. Do not introduce Supabase Auth or the Supabase SDK.
- Local development uses the PostgreSQL + pgvector container in
  `docker-compose.yml`; `npm run dev` starts it through `predev`.
- Drizzle owns the schema and migrations in `packages/shared/src/db/`. Change
  the schema there and run `npm run db:generate`.
- The API derives identity from the verified Clerk session token. Never trust a
  browser-supplied user ID for authenticated identity.

## Frontend Conventions

- Use TypeScript arrow functions, not function declarations.
- Name fixed module-level constants (lists, lookup tables) in
  `UPPER_SNAKE_CASE`, such as `SUBSCRIPTION_PLANS`. Objects built from
  environment variables or config, such as `featureFlags` or `routes`, stay
  `camelCase`.
- Prefer Server Components. Add client components only when client-side
  behavior is necessary.
- Keep Next.js to API calls under `frontend/src/lib/backend/`, typed with the inferred
  types from `@app/shared/schemas`.
- Application-owned Tailwind styles belong in a local `styles` object and must
  be wrapped with `tw()` so Prettier sorts the classes.
- Use `cn()` only for runtime conditional class merging.
- Group generic files (shared `constants`, `types`, `utils`) into sections with
  `// ---------- Section ----------` dividers. Split a section into its own file
  once it grows large.
- Give user feedback with `showToast({ type, title, message })` from
  `frontend/src/components/toaster.tsx`; `type` is `success`, `warning`, or `error`.
  Call it directly in the client component that handles the action. Server
  actions return a result, and the calling client component turns it into a
  toast.
- Do not refactor copied shadcn/ui components in `frontend/src/components/ui/` or Velora
  components in `frontend/src/components/velora/` into the application styling pattern.
- The thread components in `frontend/src/components/assistant-ui/` are app-owned and
  built on assistant-ui primitives; they follow the application styling
  pattern. Add assistant-ui pieces by writing them there, not with the shadcn
  CLI, which would replace this repo's Base UI components.
- The Conversation thread uses assistant-ui on a custom-backend runtime, never
  its LangGraph runtime (see
  `docs/adr/0004-assistant-ui-for-the-conversation-thread.md`). Do not wire up message
  editing, regeneration, or branching handlers; v1 history only grows.
- assistant-ui's names (Thread, Assistant, Attachment, `source` parts) stay
  inside its components and runtime glue. Domain code, types, and UI copy use
  the terms in `CONTEXT.md` (Conversation, Mentor, Source, Citation).
- Keep marketing components in `frontend/src/components/marketing/`, subscribed-app
  components in `frontend/src/components/subscribed/`, and theme components in
  `frontend/src/components/theme/`.

## Implementing Designs

- Book Mentor replaces the starter kit's shell with a chat layout. Its visual
  references are the [v2 canvas](https://claude.ai/artifact/QtPG3Bwz9Y6m5Htd7tiFb4)
  (sidebar, New Conversation, Conversation, built on assistant-ui's thread
  look) and the [v1 canvas](https://claude.ai/artifact/HbV6e1NR4qCuV99cV5rViA)
  (Library, Add Source, Delete Source, landing page); `docs/v1-product.md`
  says which screen follows which. The starter kit's
  [App Shell canvas](https://claude.ai/artifact/HWhacGtes2kTC143kN4aUk) only
  documents the code as it was before that change.
- A new subscribed page lives under `frontend/src/app/(subscribed)/` and is wired in
  three places: its path in `frontend/src/lib/routes.ts`, its nav item in
  `frontend/src/components/app-sidebar.tsx`, and its breadcrumb in `routeContext` in
  `frontend/src/components/subscribed/app-header.tsx`.
- Redirects and links into the app use `routes.appHome`. Only the Overview
  page's own nav item and breadcrumb use `routes.workspace.overview`.
- Pages follow the existing page pattern: a `mx-auto w-full max-w-7xl`
  container, `PageHeader`, then white cards styled like the ones in
  `frontend/src/components/subscribed/billing.tsx`.
- Translate design colors, radii, and fonts to theme tokens (`bg-card`,
  `text-muted-foreground`, `border`, `bg-primary`, `rounded-xl`) so light and
  dark themes both follow.

## Authentication and Billing

- Clerk webhooks synchronize `users` in PostgreSQL.
- Stripe webhooks synchronize the current subscription state in
  `subscriptions`; authorization reads local subscription state rather than
  querying Stripe on every request.
- Server-side Next.js pages use the subscription helpers in
  `frontend/src/lib/subscription/`. API routes get the same check from the subscribed
  scope (`requireSubscriptionPlan(...)`). Both read the plan rules from
  `@app/shared/constants`.
- Keep Stripe SDK use, customer creation, Checkout Session creation, and
  Customer Portal Session creation server-only.
- Each project uses its own Stripe sandbox. Local Stripe webhooks come from
  the Stripe CLI (`stripe listen`, started by `npm run dev`), never from a
  dashboard destination pointing at a tunnel; the dashboard destination is for
  production only. When the Stripe webhook route handles a new event type, add
  it to the `stripe:listen` script's `--events` list and to the production
  destination.

## Backend Conventions

- Install packages from the repo root into a workspace, such as
  `npm install <package> -w @app/backend`. A `backend/package-lock.json` or
  `backend/node_modules/` means something ran outside the workspace.
- `npm run dev` at the root starts the database, Next.js, the API, and the
  Stripe listener together. The API reads `backend/.env`.
- Give each feature a folder in `backend/src/<feature>/` with
  `<feature>.route.ts` (path, Zod schemas, Swagger metadata),
  `<feature>.controller.ts` (request handling), and `<feature>.service.ts`
  (business logic and Drizzle queries). Small features can skip layers.
- Test each feature next to it (`backend/src/<feature>/*.test.ts`, run with
  `npm test -w @app/backend`). Tests start the real API on a free port
  (`createApp()` in `backend/src/create-app.ts`) and call it with axios, like
  the frontend, against the `book_mentor_test` database, which is created and
  migrated automatically. Clerk and OpenAI are mocked in
  `backend/src/testing/setup.ts`. Docker must be running.
- Register routes in the matching scope in `backend/src/create-app.ts`: public;
  protected (`authenticate`, sets `request.user`); or subscribed
  (`requireSubscriptionPlan(...)`, sets `request.subscription`). Nest a scope
  for plan-gated routes.
- Auth hooks run in `preHandler`, after `clerkPlugin` reads the token there; an
  `onRequest` hook sees no session.
- Every route declares its success response schema from `@app/shared/schemas`
  and uses `withTypeProvider<ZodTypeProvider>()`. Routes don't list their
  error codes: errors are thrown as `HttpError`, `errorHandler` sends them with
  the `{ detail }` body, and the tests document which errors each route returns.
- Fastify treats `/path` and `/path/` as different routes; call routes without a
  trailing slash.
- CORS accepts only `FRONTEND_URL`; keep it aligned with the Next.js app URL.
- The API entry is `backend/src/main.ts`. Vercel deploys the esbuild bundle
  from `npm run build` (`backend/server.js`), which inlines `@app/shared`
  because Node can't load its TypeScript source from `node_modules`. Vercel
  picks the entrypoint by file name, so never add `src/app`, `src/index`, or
  `src/server` files to the backend: Vercel would run them unbundled.
- The root `package.json` `overrides` pins `@fastify/static` (used by Swagger
  UI) to 10.1.3. Newer versions `require()` the ESM-only `content-disposition`
  v3, which Vercel's runtime loader rejects (`ERR_REQUIRE_ESM`, every route
  returns 500). Before removing the pin, run the bundle with
  `node --no-experimental-require-module server.js` to confirm it starts.

## Validation

Run relevant checks after changes:

```bash
# Lint, plus type checks for the Next.js app, the API, and @app/shared
npm run check
npx prettier --check <changed-files>
```
