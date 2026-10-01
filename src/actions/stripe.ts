"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { stripePriceIds } from "@/lib/stripe/config";
import { subscriptionPlan } from "@/lib/db/schema";
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
} from "@/lib/stripe";
import { getOrCreateUserByClerkId, getUserByClerkId } from "@/lib/user/user";
import { routes } from "@/lib/routes";
import {
  getSubscriptionByUserId,
  isSubscriptionActive,
} from "@/lib/subscription/subscription";
import { featureFlags } from "@/lib/feature-flags";
import { getEnvVar } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types/database";

const isSubscriptionPlan = (value: string): value is SubscriptionPlan => {
  return subscriptionPlan.enumValues.includes(value as SubscriptionPlan);
};

const redirectToCustomerPortal = async (customerId: string): Promise<never> => {
  const frontendUrl = getEnvVar("FRONTEND_URL");
  const portalUrl = await createStripeCustomerPortalSession({
    customerId,
    returnUrl: `${frontendUrl}${routes.workspace.overview}`,
  });

  redirect(portalUrl);
};

export const checkout = async (formData: FormData) => {
  if (!featureFlags.billingEnabled) {
    redirect(routes.workspace.overview);
  }

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const plan = formData.get("plan");

  if (typeof plan !== "string" || !isSubscriptionPlan(plan)) {
    throw new Error("Invalid subscription plan");
  }

  const user = await getOrCreateUserByClerkId(clerkUserId);

  if (!user) {
    throw new Error("Application user not found");
  }

  const subscription = await getSubscriptionByUserId(user.id);

  if (isSubscriptionActive(subscription)) {
    if (!user.stripeCustomerId) {
      throw new Error("Active subscription is missing a Stripe customer");
    }

    return redirectToCustomerPortal(user.stripeCustomerId);
  }

  const frontendUrl = getEnvVar("FRONTEND_URL");
  const priceId = stripePriceIds[plan];

  if (!priceId) {
    throw new Error(`Stripe price is not configured for plan: ${plan}`);
  }

  const checkoutUrl = await createStripeCheckoutSession({
    priceId,
    user,
    successUrl: `${frontendUrl}${routes.payment.success}`,
    cancelUrl: `${frontendUrl}${routes.payment.cancelled}`,
  });

  redirect(checkoutUrl);
};

export const customerPortal = async () => {
  if (!featureFlags.billingEnabled) {
    redirect(routes.workspace.overview);
  }

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  const user = await getUserByClerkId(clerkUserId);

  if (!user) {
    throw new Error("Application user not found");
  }

  if (!user.stripeCustomerId) {
    throw new Error("Stripe customer not found");
  }

  return redirectToCustomerPortal(user.stripeCustomerId);
};
