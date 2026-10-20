<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guidelines

## Scope and Workflow

- Prefer simple, understandable architecture over abstractions introduced for
  hypothetical future needs.
- Do not expand the starter-kit scope or make unrelated changes.
- Do not create branches, stage files, or commit unless explicitly requested.
- Inspect the existing implementation before changing code. Preserve established
  naming, structure, and patterns when they are already clear.

## Architecture Boundaries

- The repository is an npm workspaces monorepo: the Next.js app at the root,
  the Fastify API in `backend/` (`@app/backend`), and the shared package in
  `packages/shared/` (`@app/shared`).
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
- Keep Next.js to API calls under `src/lib/backend/`, typed with the inferred
  types from `@app/shared/schemas`.
- Application-owned Tailwind styles belong in a local `styles` object and must
  be wrapped with `tw()` so Prettier sorts the classes.
- Use `cn()` only for runtime conditional class merging.
- Group generic files (shared `constants`, `types`, `utils`) into sections with
  `// ---------- Section ----------` dividers. Split a section into its own file
  once it grows large.
- Give user feedback with `showToast({ type, title, message })` from
  `src/components/toaster.tsx`; `type` is `success`, `warning`, or `error`.
  Call it directly in the client component that handles the action. Server
  actions return a result, and the calling client component turns it into a
  toast.
- Do not refactor copied shadcn/ui components in `src/components/ui/` or Velora
  components in `src/components/velora/` into the application styling pattern.
- Keep marketing components in `src/components/marketing/`, subscribed-app
  components in `src/components/subscribed/`, and theme components in
  `src/components/theme/`.

## Implementing Designs

- The app shell is code-owned; its visual reference is the
  [App Shell canvas](https://claude.ai/artifact/HWhacGtes2kTC143kN4aUk).
  Implement a design's page content inside the existing shell and change the
  shell only when the request asks for it.
- A new subscribed page lives under `src/app/(subscribed)/` and is wired in
  three places: its path in `src/lib/routes.ts`, its nav item in
  `src/components/app-sidebar.tsx`, and its breadcrumb in `routeContext` in
  `src/components/subscribed/app-header.tsx`.
- Redirects and links into the app use `routes.appHome`. Only the Overview
  page's own nav item and breadcrumb use `routes.workspace.overview`.
- Pages follow the existing page pattern: a `mx-auto w-full max-w-7xl`
  container, `PageHeader`, then white cards styled like the ones in
  `src/components/subscribed/billing.tsx`.
- Translate design colors, radii, and fonts to theme tokens (`bg-card`,
  `text-muted-foreground`, `border`, `bg-primary`, `rounded-xl`) so light and
  dark themes both follow.

## Authentication and Billing

- Clerk webhooks synchronize `users` in PostgreSQL.
- Stripe webhooks synchronize the current subscription state in
  `subscriptions`; authorization reads local subscription state rather than
  querying Stripe on every request.
- Server-side Next.js pages use the subscription helpers in
  `src/lib/subscription/`. API routes get the same check from the subscribed
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
- Register routes in the matching scope in `backend/src/app.ts`: public;
  protected (`authenticate`, sets `request.user`); or subscribed
  (`requireSubscriptionPlan(...)`, sets `request.subscription`). Nest a scope
  for plan-gated routes.
- Auth hooks run in `preHandler`, after `clerkPlugin` reads the token there; an
  `onRequest` hook sees no session.
- Every route declares response schemas from `@app/shared/schemas`, including
  `errorResponseSchema` for 401/403/404 on protected routes, and uses
  `withTypeProvider<ZodTypeProvider>()`. Errors use the `{ detail }` body.
- Fastify treats `/path` and `/path/` as different routes; call routes without a
  trailing slash.
- CORS accepts only `FRONTEND_URL`; keep it aligned with the Next.js app URL.

## Validation

Run relevant checks after changes:

```bash
# Lint, plus type checks for the Next.js app, the API, and @app/shared
npm run check
npx prettier --check <changed-files>
```
