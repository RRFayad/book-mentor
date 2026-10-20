import type { SUBSCRIPTION_PLANS } from "./constants";

// Shared domain types that don't belong to a schema file. Types inferred from a
// schema live next to it: database rows in db/schema.ts, API types in
// schemas.ts.

// ---------- Subscription ----------

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
