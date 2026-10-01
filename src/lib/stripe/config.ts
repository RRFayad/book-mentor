import type { SubscriptionPlan } from "@/types/database";

import { getEnvVar } from "@/lib/utils";

export const stripePriceIds = {
  basic: getEnvVar("STRIPE_BASIC_PRICE_ID", false),
  premium: getEnvVar("STRIPE_PREMIUM_PRICE_ID", false),
  all_in: getEnvVar("STRIPE_ALL_IN_PRICE_ID", false),
} satisfies Record<SubscriptionPlan, string | undefined>;

type StripePlanDetails = {
  name: string;
  description: string;
  displayPrice: string;
  interval: string;
  features: string[];
  isMostPopular: boolean;
};

export type AvailableStripePlan = StripePlanDetails & {
  plan: SubscriptionPlan;
};

// Keep this marketing copy aligned with the corresponding Stripe Prices.
const stripePlanDetails: Record<SubscriptionPlan, StripePlanDetails> = {
  basic: {
    name: "Basic",
    description: "Everything needed to launch your SaaS product.",
    displayPrice: "$0.01",
    interval: "per month",
    features: [
      "Authentication and user synchronization",
      "Stripe Checkout and Customer Portal",
      "PostgreSQL persistence",
      "Standard features",
      "Community support",
    ],
    isMostPopular: false,
  },
  premium: {
    name: "Premium",
    description: "More room to build, validate, and grow your product.",
    displayPrice: "$0.02",
    interval: "per month",
    features: [
      "Everything in Basic",
      "Subscription-based authorization",
      "FastAPI product backend",
      "Advanced features",
      "Priority support",
    ],
    isMostPopular: true,
  },
  all_in: {
    name: "All In",
    description: "The full foundation for your next SaaS product.",
    displayPrice: "$0.03",
    interval: "per month",
    features: [
      "Everything in Premium",
      "AI-ready Python architecture",
      "Priority starter-kit updates",
      "All product features",
      "Premium support",
    ],
    isMostPopular: false,
  },
};

export const getAvailableStripePlans = (): AvailableStripePlan[] => {
  const plans = (Object.keys(stripePriceIds) as SubscriptionPlan[])
    .filter((plan) => Boolean(stripePriceIds[plan]))
    .map((plan) => ({ plan, ...stripePlanDetails[plan] }));

  if (plans.length === 0) {
    throw new Error("At least one Stripe price ID must be configured");
  }

  return plans;
};
