import type { SUBSCRIPTION_PLANS } from "./constants";
import type { subscriptions, users } from "./db/schema";

// ---------- Database rows (inferred from the Drizzle schema) ----------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;

// ---------- Subscription ----------

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
