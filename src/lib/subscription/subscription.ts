import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { subscriptions } from "@/lib/db/schema";
import { Subscription, SubscriptionPlan } from "@/types/database";
import { featureFlags } from "@/lib/feature-flags";
import { getCurrentUser } from "../user/user";
import { routes } from "@/lib/routes";

const subscriptionPlanLevel: Record<SubscriptionPlan, number> = {
  basic: 1,
  premium: 2,
  all_in: 3,
};

export const getSubscriptionByUserId = async (
  userId: number,
): Promise<Subscription | null> => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  return subscription ?? null;
};

export const getCurrentUserSubscription =
  async (): Promise<Subscription | null> => {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    return getSubscriptionByUserId(user.id);
  };

export const isSubscriptionActive = (
  subscription: Subscription | null,
): subscription is Subscription => {
  if (!subscription) {
    return false;
  }

  return ["active", "trialing"].includes(subscription.status);
};

export const canAccessSubscriptionPlan = (
  subscription: Subscription | null,
  requiredPlan: SubscriptionPlan,
): boolean => {
  if (!isSubscriptionActive(subscription)) {
    return false;
  }

  return (
    subscriptionPlanLevel[subscription.plan] >=
    subscriptionPlanLevel[requiredPlan]
  );
};

export const canCurrentUserAccessSubscriptionPlan = async (
  requiredPlan: SubscriptionPlan,
): Promise<boolean> => {
  const subscription = await getCurrentUserSubscription();

  return canAccessSubscriptionPlan(subscription, requiredPlan);
};

export const requireCurrentUserSubscriptionPlan = async (
  requiredPlan: SubscriptionPlan,
): Promise<void> => {
  const { userId } = await auth();

  if (!userId) {
    redirect(routes.signIn);
  }

  if (!featureFlags.billingEnabled) {
    return;
  }

  if (!(await canCurrentUserAccessSubscriptionPlan(requiredPlan))) {
    redirect(routes.pricing);
  }
};

// The same rule as requireCurrentUserSubscriptionPlan, without redirects.
// Server actions are not covered by the (subscribed) layout's check, so each
// one calls this before doing anything.
export const canCurrentUserUseSubscriptionPlan = async (
  requiredPlan: SubscriptionPlan,
): Promise<boolean> => {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  if (!featureFlags.billingEnabled) {
    return true;
  }

  return canCurrentUserAccessSubscriptionPlan(requiredPlan);
};
