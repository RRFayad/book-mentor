# SaaS Starter Kit

A reusable full-stack TypeScript foundation for subscription SaaS products, including AI applications.

Built to handle the SaaS infrastructure once, so new products can start with authentication, billing, database persistence, authorization, and an API backend already working.

> **v2** replaced the FastAPI (Python) backend with Fastify (TypeScript). The Python version is available in [v1.1.4](https://github.com/RRFayad/saas-starter-kit/releases/tag/v1.1.4).

[Live Demo](https://rf-saas-starter-kit.vercel.app/)

[Watch the Video Walkthrough](https://www.loom.com/share/b9e6a7a19a3e42b686d7ca6208469023)

## What's Included

- Next.js + TypeScript frontend
- Fastify + TypeScript API backend
- npm workspaces monorepo with a shared package (`@app/shared`)
- PostgreSQL database, with a local Docker setup (pgvector included)
- Drizzle ORM + migrations, shared by the frontend and the API
- Zod API schemas shared by the frontend and the API
- API docs with Swagger (OpenAPI) at `/docs`
- Clerk authentication
- Clerk → PostgreSQL user synchronization
- Stripe Checkout and Customer Portal
- Stripe → PostgreSQL subscription synchronization
- Subscription authorization in Next.js and the API
- Protected Next.js → API communication
- Responsive landing page and authenticated app shell
- Billing and account management
- Toast notifications
- Tailwind CSS + shadcn/ui + Velora UI
- Light/dark themes

## Architecture

```text
Browser
   │
   ▼
Next.js
   ├── UI / App Shell
   ├── Clerk Authentication
   ├── Clerk Webhooks
   ├── Stripe Checkout / Portal
   ├── Stripe Webhooks
   └── SaaS Authorization
   │
   ├──────────────► PostgreSQL
   │
   ▼
Fastify API
   ├── Clerk Token Validation
   ├── Subscription Authorization
   ├── Swagger Docs (/docs)
   └── Product / AI Logic
   │
   ▼
PostgreSQL

@app/shared (used by both)
   ├── Drizzle schema + migrations
   ├── Zod API schemas
   └── Constants, types, utils
```

### Responsibilities

**Next.js owns SaaS infrastructure:**

- Authentication
- User synchronization
- Billing
- Subscription state
- Account management

**The API (Fastify) owns product/domain logic:**

- Product APIs
- Future domain logic (AI features, etc)

**`@app/shared` holds what both sides must agree on:**

- The Drizzle schema and migrations
- The API contract (Zod schemas, with types inferred from them)
- Shared constants, types, and utils

Both apps use the same PostgreSQL database through the same Drizzle schema.

Stripe remains the billing source of truth. PostgreSQL stores the current subscription state used for authorization.

## Project Structure

```text
src/                   Next.js app
  actions/             Server Actions
  app/                 Next.js routes
  components/          UI components
  lib/
    backend/           Next.js → API client
    db/                Drizzle client
    stripe/            Stripe integration
    subscription/      Subscription authorization
    user/              User queries

backend/src/           Fastify API (@app/backend)
  main.ts              App entry: setup, plugins, and route scopes
  db.ts                Drizzle client
  auth/                Clerk authentication + subscription hooks
  dashboard/           Sample feature (route + controller)
  healthcheck/         Health check route

packages/shared/src/   Shared package (@app/shared)
  db/                  Drizzle schema, row types, and migrations
  schemas.ts           Zod API schemas and their types (the API contract)
  constants.ts         Shared constants
  types.ts             Shared types not tied to a schema
  utils.ts             Shared helpers
```

---

# Start a New SaaS

## 1. Clone the Starter

```bash
git clone https://github.com/RRFayad/saas-starter-kit.git my-saas
cd my-saas
```

## 2. Create Your Own Git Repository

The clone initially contains the SaaS Starter Kit Git history.

Remove it:

```bash
rm -rf .git
```

Initialize a fresh repository:

```bash
git init
git add .
git commit -m "chore: initialize project from SaaS Starter Kit"
```

Create an empty repository for your new product on GitHub, then connect it:

```bash
git remote add origin https://github.com/<your-username>/<your-repository>.git
git branch -M main
git push -u origin main
```

Your product now has its own Git history and is independent from the Starter Kit.

## 3. Create Local Environment Files

Create the ignored local environment files before configuring providers:

```bash
touch .env.local backend/.env
```

**Important:** Confirm both files are ignored in your repo.

Start with these templates. Fill each value in the relevant setup step below.

`.env.local`:

```env
# Application - Replace these with the deployed service URLs in production.
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://127.0.0.1:8000

# Features
LANDING_PAGE_ENABLED=true
BILLING_ENABLED=true

# Database
DATABASE_URL=postgresql://...

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Stripe: required only when BILLING_ENABLED=true
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test...
STRIPE_SECRET_KEY=sk_test_...

# Stripe Prices: configure at least one
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ALL_IN_PRICE_ID=price_...

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: automatically apply a Stripe Coupon to Checkout demos
STRIPE_DEMO_COUPON_ID=

# Optional: enables GitHub links on the landing page and in the SaaS shell
NEXT_PUBLIC_GITHUB_URL=

```

`backend/.env`:

```env
# Same database and frontend URL as .env.local.
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000

# Same Clerk application as .env.local.
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Keep this aligned with .env.local.
BILLING_ENABLED=true

# Optional: defaults to localhost:8000.
PORT=
HOST=
```

Both apps must use the same `DATABASE_URL`.

### Feature Flags

Both flags must be exactly `true` or `false`.

| `LANDING_PAGE_ENABLED` | `BILLING_ENABLED` | Use case                         |
| ---------------------- | ----------------- | -------------------------------- |
| `true`                 | `true`            | Normal commercial SaaS           |
| `true`                 | `false`           | Free product or portfolio app    |
| `false`                | `false`           | Internal or private app          |
| `false`                | `true`            | Invite-only or private paid SaaS |

`LANDING_PAGE_ENABLED` controls whether `/` shows the marketing page. When it
is disabled, `/` redirects to the authenticated workspace.

`BILLING_ENABLED` controls pricing, Checkout, Customer Portal, Stripe webhooks,
and subscription authorization. Set it to the same value in `.env.local` and
`backend/.env`. When it is `false`, Stripe environment variables are not
required.

## 4. Install Dependencies

From the project root (installs the Next.js app, the API, and the shared
package):

```bash
npm install
```

The repository is an npm workspaces monorepo. Always install packages from the
root, targeting a workspace, for example
`npm install <package> -w @app/backend`.

Prerequisites:

- Node.js 20 or newer
- npm
- Docker Desktop (for the local database)
- Stripe CLI (for local Stripe webhooks): `brew install stripe/stripe-cli/stripe`

## 5. Create PostgreSQL Database

### Local development: Docker

The repository includes a `docker-compose.yml` that runs PostgreSQL 18 with the
pgvector extension. `npm run dev` starts it automatically (through the `predev`
script), so you only need Docker Desktop running.

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
```

Useful commands:

```bash
docker compose up -d     # start the database (npm run dev does this for you)
docker compose down      # stop it; data is kept
docker compose down -v   # stop it and delete all data
```

Container and volume names come from the project folder, so several projects
built from this kit don't clash. If port 5432 is taken, set `DB_PORT=5433` in a
`.env` file and use that port in `DATABASE_URL`.

### Production: hosted PostgreSQL

Create a PostgreSQL database using Supabase or another hosted provider.

**If using Supabase**, go to **Connect → Connection string → Direct
connection / URI** and copy the PostgreSQL connection string. Do not use the
Supabase REST API URL.

Next.js and the API must use the same database.

Supabase is used only as PostgreSQL hosting in the reference project. The Starter Kit does not depend on Supabase Auth, Storage, or its SDK.

Add the connection URL as `DATABASE_URL` to both `.env.local` and
`backend/.env`.

## 6. Configure Clerk

Give local development and the deployed app separate Clerk environments, so
users and webhooks never cross between them:

- **With your own domain:** use one Clerk application. Its development instance
  (`pk_test_...`) is for local development, and its production instance
  (`pk_live_...`) is for the deployed app. Production instances require a
  domain you own; they can't use `*.vercel.app`.
- **Without a domain yet** (for example, a demo on `*.vercel.app`): create two
  Clerk applications, such as `My SaaS (local)` and `My SaaS (vercel)`, and use
  each one's development keys in its own environment.

Create a Clerk application and copy its publishable and secret keys (Overview > Manual Setup) to `.env.local` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

`npm install` does not create Clerk environment variables. Clerk's `clerk init`
CLI can write those two keys, but do not run it on this clone because Clerk is
already integrated and the command can modify existing setup files.

Add the same two keys to `backend/.env` as `CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY`. The API uses them to verify the session tokens Next.js
sends.

### Create a Clerk webhook:

Add one endpoint per environment, each in that environment's Clerk application
or instance (Configure > Webhooks > Add Endpoint), subscribed to:

```text
user.created
user.updated
user.deleted
```

**Local development:** Clerk can't reach `localhost`, so expose Next.js with an
HTTPS tunnel such as ngrok:

```bash
ngrok http 3000
```

```text
https://<your-ngrok-url>/api/webhooks/clerk
```

Copy the endpoint's signing secret into `.env.local` as
`CLERK_WEBHOOK_SIGNING_SECRET`.

**Production:**

```text
https://<your-public-app-url>/api/webhooks/clerk
```

Copy that endpoint's signing secret into the deployment's environment variables
(for example, Vercel). Each endpoint has its own secret.

## 7. Configure Stripe (Optional - Required when `BILLING_ENABLED=true`)

You do not need to create customers or subscriptions manually; the application
creates them through Stripe Checkout.

### Create a Sandbox

Give each project its own Stripe **Sandbox** (account menu > Sandboxes >
Create). A sandbox is an isolated test environment with its own API keys,
products, customers, and webhooks.

A Stripe account sends every event to every webhook destination it has. When
several projects, or local and production, share one account, each event
reaches apps it doesn't belong to, and signature checks fail for the
destinations whose secrets don't match. A sandbox per project keeps them apart.

### Create Products and Prices

In the sandbox, go to Settings > Developers > API keys. Copy the publishable and secret API
keys into `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and
`STRIPE_SECRET_KEY`, respectively.

In Stripe Dashboard, open the Product catalog. For each plan you want to offer:

1. Create a Product, for example `My SaaS - Basic Plan`, `My SaaS - Premium Plan`, or `My SaaS - All In Plan`.
2. Add one flat-rate **recurring** Price with your currency and billing
   interval, such as monthly.
3. Copy its `price_...` ID into the matching variable in `.env.local`.

4. Update the matching display copy in `src/lib/stripe/config.ts`. Landing-page
   prices are intentionally not fetched from Stripe.

The starter supports these plan variables:

```text
STRIPE_BASIC_PRICE_ID
STRIPE_PREMIUM_PRICE_ID
STRIPE_ALL_IN_PRICE_ID
```

At least one plan must have a configured Stripe Price ID.

### Configure Customer Portal

Search for Customer Portal settings and activate **Customers can switch plans**.
Add the products you created, then review the other portal settings as well.

The starter already creates Customer Portal sessions from its Billing page and
synchronizes plan changes through `customer.subscription.updated`.

### Create a Webhook

The application only learns about subscriptions through Stripe webhooks, so
pages stay gated until the webhook works.

#### Local development: Stripe CLI

Log in to the project's sandbox and get the local signing secret:

```bash
stripe login
npm run stripe:listen
```

`stripe listen` prints a webhook signing secret (`whsec_...`). Add it to
`.env.local` as `STRIPE_WEBHOOK_SECRET`, then stop the command. The secret
stays the same across runs on the same machine.

From then on, `npm run dev` runs the listener next to Next.js, so you don't
start it yourself. Do not create a dashboard destination pointing at a tunnel
URL: it duplicates deliveries and needs its own secret.

The `stripe:listen` script forwards the same five subscription events that the
production destination subscribes to (listed below). When the webhook route
starts handling a new event type, add it to both the script's `--events` list
and the production destination.

To explore which events Stripe sends for a flow, run the listener with every
event instead (the route logs `Unhandled Stripe event` for the ones it ignores):

```bash
stripe listen --all-snapshot --forward-to localhost:3000/api/webhooks/stripe
```

#### Production : Webhooks Dashboard destination

Go to Developers > Webhooks > Add Destination > API Version `2026-08-26.dahlia`

**Subscribe to:**

```text
customer.subscription.created
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
customer.subscription.updated
```

**Add endpoint:**

```text
https://<your-public-app-url>/api/webhooks/stripe
```

Copy the destination's signing secret into the deployment's environment
variables (for example, Vercel) as `STRIPE_WEBHOOK_SECRET`. Each destination has
its own secret; don't reuse it in `.env.local`.

### Discount Coupon

If you want to create a discount coupon (e.g. a demo 100% coupon) to be automatically applied to Stripe:

- Go to Dashboard > Product Catalog > Coupons
- Create a coupon;
- Set `STRIPE_DEMO_COUPON_ID` in `.env.local`

## 8. Share your Repo (Optional)

- If you want to share your repository, for example as a portfolio project, add
  its URL to `NEXT_PUBLIC_GITHUB_URL` in `.env.local`. This enables GitHub
  links on the landing page and in the SaaS shell.

## 9. Review Environment Variables

Before running the application, confirm:

- `.env.local` has the database URL, Clerk keys and webhook secret, application
  URLs, Stripe secret/webhook secrets, and at least one Stripe Price ID.
- `backend/.env` has the same `DATABASE_URL`, `FRONTEND_URL`, Clerk keys, and
  `BILLING_ENABLED` as `.env.local`.
- Optional values are intentional: GitHub links are hidden without
  `NEXT_PUBLIC_GITHUB_URL`, and no demo coupon is applied without
  `STRIPE_DEMO_COUPON_ID`.

## 10. Apply Database Migrations

If you use the local Docker database, start it first:

```bash
docker compose up -d
```

From the project root:

```bash
npm run db:migrate
```

Run this against every new or reset database (for example after
`docker compose down -v`); otherwise the app fails because the tables don't
exist.

The schema lives in `packages/shared/src/db/schema.ts`. When changing it:

```bash
npm run db:generate
npm run db:migrate
```

Commit generated migrations with the schema change.

## 11. Run Locally

From the project root, one command starts everything:

```bash
npm run dev
```

It starts the local database container, then runs Next.js (`[web]`), the API
(`[api]`), and the Stripe webhook listener (`[stripe]`) side by side, with each
process's output labeled. `Ctrl+C` stops all of them.

Services:

```text
Next.js:   http://localhost:3000
API:       http://localhost:8000
Health:    http://localhost:8000/healthcheck
API docs:  http://localhost:8000/docs
```

To call protected routes from the API docs or Postman, get a session token from
the browser console while signed in to the app
(`await window.Clerk.session.getToken()`) and send it as
`Authorization: Bearer <token>`. Session tokens expire after about a minute.

## 12. Verify the Starter

Before building product features, verify the complete SaaS foundation:

- Sign up through Clerk
- Confirm the user is synchronized to PostgreSQL
- Select a subscription plan (if billing is enabled)
- Complete Stripe Checkout
  - **Important:** If you did not set a 100% coupon, fill out the credit card
    form with:
    - Card number: 4242 4242 4242 4242
    - MM/YY: Any future date
    - CVC: Any three digits

### Verify:

- Confirm the subscription is synchronized to PostgreSQL
- Open the protected workspace
- Confirm the protected API request works (sample dashboard on the Overview page)
- Click **Check API health** on the Overview page
- Open the API docs at `/docs`
- Open Stripe Customer Portal from Billing
- Confirm account management works

Once these work, the SaaS foundation is ready.

---

# Building Your Product

The Starter Kit intentionally separates SaaS infrastructure from product logic.

```text
Next.js
  → SaaS infrastructure + UI

Fastify API
  → Product/domain/AI logic
```

For an AI SaaS, product features such as these belong primarily in the API:

```text
Document ingestion
Retrieval / RAG
Embeddings
Conversations
LLM calls
Agents
Streaming
Product-specific APIs
```

The existing authentication, users, subscriptions, billing, and authorization infrastructure can remain unchanged.

## Adding an API Feature

Give each feature its own folder in `backend/src/`, named after the feature,
with three files:

```text
backend/src/<feature>/
  <feature>.route.ts        Route definition: path, Zod schemas, Swagger metadata
  <feature>.controller.ts   Request handling: reads the request, returns the response
  <feature>.service.ts      Business logic and database access (Drizzle)
```

- **Route:** declares the path and attaches the request and response schemas
  from `@app/shared/schemas`. The schemas validate every request and response
  and generate the Swagger docs.
- **Controller:** turns an HTTP request into a service call and the result
  into a response. It stays thin.
- **Service:** holds the actual logic and queries, with no knowledge of HTTP,
  so it can be reused and tested on its own.

Small features can skip a layer: `healthcheck` only has a route, and the sample
`dashboard` has a route and a controller.

Then register the routes in the right scope in `backend/src/main.ts`:

| Scope      | Hooks                                                              | For                             |
| ---------- | ------------------------------------------------------------------ | ------------------------------- |
| Public     | none                                                               | Health checks, public endpoints |
| Protected  | `authenticate` (sets `request.user`)                               | Any signed-in user              |
| Subscribed | + `requireSubscriptionPlan("basic")` (sets `request.subscription`) | Paid features                   |

For a plan-gated feature, nest another scope with
`requireSubscriptionPlan("premium")` (or `"all_in"`).

Define the request and response schemas in
`packages/shared/src/schemas.ts`. The frontend uses the inferred types
(`z.infer`) for the data it receives, so a contract change shows up as a type
error on both sides.

The `dashboard` feature is a sample endpoint: use it as a template for your
first real feature, then delete it (its folder, its schema in `schemas.ts`, and
the Overview page that renders it).

## Database Ownership

The Drizzle schema and migrations live in `packages/shared/src/db/` and are
shared by the Next.js app and the API. Both apps read and write SaaS tables
such as `users` and `subscriptions` through the same schema.

Add product-specific tables to the same schema and generate a migration with
`npm run db:generate`.

## Designing Product Screens

The authenticated app shell (sidebar, top header, grey content area) is already implemented in code. Its design lives in the [App Shell canvas](https://claude.ai/artifact/HWhacGtes2kTC143kN4aUk) in Claude Design: desktop expanded, desktop collapsed, and mobile with the menu closed and open.

Each page renders inside the content area as a page header followed by its own white card(s):

```text
Sidebar | Header (breadcrumb, theme toggle, GitHub)
        | Grey content area
        |   Page header (title + description)
        |   White card → page content
```

To design and build a new product screen:

1. **Create your canvas** — open the App Shell canvas, export it with **Share › Export › HTML (.zip)**, extract it, and ask Claude Code to create your own Claude Design canvas from the extracted files. The new canvas lives in your account and is fully editable.
2. **Design** — on that canvas, add frames for your product screens with `/design`, stating that each screen lives inside the shell's content area so only the page content is new.
3. **Iterate** — refine the frames in the canvas until the screens are right.
4. **Implement** — paste your canvas link into Claude Code and ask it to implement the screens. `AGENTS.md` tells the agent how a new page plugs into the shell.
5. **Keep code as the source of truth** — once implemented, the code wins; the canvas is a reference.

The shell design stays neutral on purpose: re-skin a new SaaS through the theme tokens in `src/app/globals.css` (`--primary`, `--radius`, fonts) rather than by editing the shell components.

---

# Development Checks

Run all checks (lint, plus a type check for the Next.js app, the API, and the
shared package):

```bash
npm run check
npm run build
```

---

# Production Notes

When using the Starter Kit for a real production application:

- Deploy the Next.js app and the API as separate services, each with its own
  environment variables.
- On Vercel, the API project uses the **Fastify** framework preset with Root
  Directory `backend` and "Include files outside the root directory" enabled.
  Vercel runs the backend's `npm run build`, an esbuild bundle that inlines
  `@app/shared`, and serves it as the function entrypoint (`server.js`).
- Update Frontend and Backend URL env vars.
- Update Clerk and Stripe webhook endpoints.
- Keep database credentials server-side.
- Never expose `DATABASE_URL` through `NEXT_PUBLIC_*`.
- Use production Clerk credentials and configure the production domain/webhook.
- Use Stripe live credentials and a production webhook.
- Configure the PostgreSQL provider's appropriate production security controls.
- Store all secrets in the deployment environment.
- Test authentication, billing, webhooks, and authorization end to end.

---

# Philosophy

The Starter Kit owns the repetitive SaaS infrastructure.

Your product should own what makes the application unique.

```text
Clone the Starter Kit
        ↓
Configure infrastructure
        ↓
Verify the SaaS foundation
        ↓
Build the actual product
        ↓
Ship
```

**Build the SaaS infrastructure once. Build products on top of it.**

# Roadmap

## API Owns All Server Logic

Move the remaining server-side SaaS logic (Clerk and Stripe webhooks, Checkout,
Customer Portal, and page authorization) from Next.js into the API, so Next.js
only renders and the API owns every database and Stripe call.

## Admin Dashboard

Replace the sample dashboard with real SaaS metrics from Stripe, visible to
users with the `admin` role.

## Organizations / Teams

Extend the starter for B2B SaaS applications with:

- Organizations / workspaces
- Organization memberships
- Roles and permissions
- Organization-scoped subscriptions
- Organization-scoped product data
