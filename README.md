# SaaS Starter Kit

A reusable full-stack foundation for subscription SaaS products, including Python-first AI applications.

Built to handle the SaaS infrastructure once, so new products can start with authentication, billing, database persistence, authorization, and a Python backend already working.

[Live Demo](https://rf-saas-starter-kit.vercel.app/)

[Watch the Video Walkthrough](https://www.loom.com/share/b9e6a7a19a3e42b686d7ca6208469023)

## What's Included

- Next.js + TypeScript frontend
- FastAPI + Python backend
- PostgreSQL database
- Clerk authentication
- Clerk → PostgreSQL user synchronization
- Stripe Checkout and Customer Portal
- Stripe → PostgreSQL subscription synchronization
- Subscription authorization in Next.js and FastAPI
- Drizzle ORM + migrations
- SQLAlchemy
- Responsive landing page and authenticated app shell
- Billing and account management
- Protected Next.js → FastAPI communication
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
FastAPI
   ├── Clerk JWT Validation
   ├── Subscription Authorization
   └── Product / AI Logic
   │
   ▼
PostgreSQL
```

### Responsibilities

**Next.js owns SaaS infrastructure:**

- Authentication
- User synchronization
- Billing
- Subscription state
- Account management

**FastAPI owns product/domain logic:**

- Product APIs
- Future domain logic (AI features, etc)

Both use the same PostgreSQL database.

Drizzle owns the SaaS database schema and migrations. SQLAlchemy maps the existing tables for FastAPI access.

Stripe remains the billing source of truth. PostgreSQL stores the current subscription state used for authorization.

## Project Structure

```text
src/
  actions/             Server Actions
  app/                 Next.js routes
  components/          UI components
  lib/
    backend/           Next.js → FastAPI client
    db/                Drizzle schema and migrations
    stripe/            Stripe integration
    subscription/      Subscription authorization
    user/              User queries

backend/
  auth/                Clerk + subscription authorization
  db/                  SQLAlchemy connection/models
  routers/             Product APIs
  main.py              FastAPI application
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
CLERK_JWKS_URL=https://<your-clerk-instance>/.well-known/jwks.json

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
# SQLAlchemy requires the explicit Psycopg 3 driver prefix.
DATABASE_URL="postgresql+psycopg://..."
CLERK_JWKS_URL=https://<your-clerk-instance>/.well-known/jwks.json
FRONTEND_URL=http://localhost:3000

# Keep this aligned with .env.local.
BILLING_ENABLED=true
```

The two database URLs must target the same PostgreSQL database. Next.js uses
`postgresql://...`; FastAPI uses `postgresql+psycopg://...`.

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

Frontend:

```bash
npm install
```

Backend:

```bash
cd backend
uv sync
cd ..
```

Prerequisites:

- Node.js
- npm
- Python 3.14
- uv

## 5. Create PostgreSQL Database

Create a PostgreSQL database using Supabase, another hosted provider, or local PostgreSQL.

**If using Supabase**, go to **Connect → Connection string → Direct
connection / URI** and copy the PostgreSQL connection string. Do not use the
Supabase REST API URL. Use the PostgreSQL URI as the basis for both database
URLs below.

Next.js and FastAPI must use the same database.

Supabase is used only as PostgreSQL hosting in the reference project. The Starter Kit does not depend on Supabase Auth, Storage, or its SDK.

Add the connection URL to `.env.local` as `DATABASE_URL`, then add the same
database URL with the `postgresql+psycopg://` prefix to `backend/.env`.

## 6. Configure Clerk

Create a Clerk application and copy its publishable and secret keys to
`.env.local` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

`npm install` does not create Clerk environment variables. Clerk's `clerk init`
CLI can write those two keys, but do not run it on this clone because Clerk is
already integrated and the command can modify existing setup files.

Add the Clerk JWKS URL to `.env.local` and `backend/.env`:

```text
https://<your-clerk-instance>/.well-known/jwks.json
```

### Create a Clerk webhook:

```text
https://<your-public-app-url>/api/webhooks/clerk
```

For local testing, expose Next.js with an HTTPS tunnel such as ngrok:

```bash
ngrok http 3000
```

Use the generated URL as the webhook endpoint:

```text
https://<your-ngrok-url>/api/webhooks/clerk
```

Subscribe to:

```text
user.created
user.updated
user.deleted
```

Copy the webhook signing secret.

Add it to `.env.local` as `CLERK_WEBHOOK_SIGNING_SECRET`.

## 7. Configure Stripe

Use **Test mode** while setting up the starter. You do not need to create
customers or subscriptions manually; the application creates them through
Stripe Checkout.

### Create Products and Prices

In the Stripe Dashboard, go to Developers > API keys. Copy the test-mode
publishable and secret API keys into `.env.local` as
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`, respectively.

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

For local testing, use the same ngrok URL (as on Clerk):

```text
https://<your-ngrok-url>/api/webhooks/stripe
```

Copy the webhook signing secret.

Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

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
- `backend/.env` has the Psycopg 3 database URL, Clerk JWKS URL, and the same
  `FRONTEND_URL` as `.env.local`.
- Optional values are intentional: GitHub links are hidden without
  `NEXT_PUBLIC_GITHUB_URL`, and no demo coupon is applied without
  `STRIPE_DEMO_COUPON_ID`.

## 10. Apply Database Migrations

From the project root:

```bash
npx drizzle-kit migrate
```

When changing the Drizzle schema:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Commit generated migrations with the schema change.

## 11. Run Locally

Start FastAPI:

```bash
cd backend
uv run uvicorn main:app --reload --env-file .env
```

Start Next.js in another terminal:

```bash
npm run dev
```

Services:

```text
Next.js:  http://localhost:3000
FastAPI:  http://127.0.0.1:8000
Health:   http://127.0.0.1:8000/healthy
```

## 12. Verify the Starter

Before building product features, verify the complete SaaS foundation:

- Sign up through Clerk
- Confirm the user is synchronized to PostgreSQL
- Select a subscription plan
- Complete Stripe Checkout
  - **Important:** If you did not set a 100% coupon, fill out the credit card
    form with:
    - Card number: 4242 4242 4242 4242
    - MM/YY: Any future date
    - CVC: Any three digits

### Verify:

- Confirm the subscription is synchronized to PostgreSQL
- Open the app and confirm you land on New Conversation
- Confirm FastAPI is reachable: open `<BACKEND_URL>/healthy`
- Open Stripe Customer Portal from Billing
- Confirm account management works

Once these work, the SaaS foundation is ready.

---

# Building Your Product

The Starter Kit intentionally separates SaaS infrastructure from product logic.

```text
Next.js
  → SaaS infrastructure + UI

FastAPI
  → Product/domain/AI logic
```

For an AI SaaS, product features such as these belong primarily in the FastAPI layer:

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

## Database Ownership

SaaS tables such as:

```text
users
subscriptions
```

are owned by Drizzle.

FastAPI may query them through SQLAlchemy but should not migrate them.

Product tables (Sources, Chunks, Conversations, and the rest) are owned by the
backend: SQLAlchemy models with Alembic migrations, run from `backend/`. Alembic
ignores the SaaS tables, and `drizzle-kit push` is never used, so neither tool
touches the other's tables. See `docs/adr/0005-backend-owns-product-tables.md`.

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

Run all frontend and backend checks:

```bash
npm run check
npm run build
```

---

# Production Notes

When using the Starter Kit for a real production application:

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

## v1.1 — Organizations / Teams

Extend the starter for B2B SaaS applications with:

- Organizations / workspaces
- Organization memberships
- Roles and permissions
- Organization-scoped subscriptions
- Organization-scoped product data
