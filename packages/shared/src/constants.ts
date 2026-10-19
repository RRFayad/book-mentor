// ---------- Subscription ----------

// Plans the product offers. The database enum and the SubscriptionPlan type
// both derive from this list, so adding a plan starts here.
export const SUBSCRIPTION_PLANS = ["basic", "premium", "all_in"] as const;
