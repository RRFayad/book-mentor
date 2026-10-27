import type { SubscriptionPlan } from "./types";

// ---------- Subscription ----------

// Plans the product offers. The database enum and the SubscriptionPlan type
// both derive from this list, so adding a plan starts here.
export const SUBSCRIPTION_PLANS = ["basic", "premium", "all_in"] as const;

// Access level per plan: a plan grants access to everything at or below its level.
export const SUBSCRIPTION_PLAN_LEVELS: Record<SubscriptionPlan, number> = {
  basic: 1,
  premium: 2,
  all_in: 3,
};

// Stripe subscription statuses that grant access.
export const ACTIVE_SUBSCRIPTION_STATUSES: readonly string[] = [
  "active",
  "trialing",
];

// ---------- Sources ----------

// Kinds and ingestion states of a Source. The database enums and the API
// schemas both derive from these lists.
export const SOURCE_KINDS = ["book", "blog"] as const;
export const SOURCE_STATES = ["ingesting", "ready"] as const;

// The longest book a reader can add. The browser checks it; the API enforces it.
export const MAX_BOOK_PAGES = 500;

// How many active (not yet expired) Sources a user can have at once.
export const SOURCE_LIMIT = 3;

// How long a Source is kept after it's added. Sets the default of sources.expires_at.
export const SOURCE_LIFETIME_DAYS = 7;

// ---------- Embeddings ----------

// The model that embeds chunks and questions. Both must use the same one, and
// the chunks.embedding column has exactly this many dimensions.
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
