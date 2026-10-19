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
