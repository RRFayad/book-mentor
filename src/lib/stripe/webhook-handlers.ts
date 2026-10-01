import "server-only";

import type Stripe from "stripe";
import { eq, sql } from "drizzle-orm";

import { stripePriceIds } from "@/lib/stripe/config";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import type { SubscriptionPlan } from "@/types/database";

type SubscriptionWebhookEvent = Stripe.Event & {
  data: { object: Stripe.Subscription };
};

const getPlanForPriceId = (priceId: string): SubscriptionPlan => {
  const priceEntry = (
    Object.entries(stripePriceIds) as [SubscriptionPlan, string | undefined][]
  ).find(([, configuredPriceId]) => configuredPriceId === priceId);

  if (!priceEntry) {
    throw new Error(
      `Stripe price is not configured for subscription: ${priceId}`,
    );
  }

  return priceEntry[0];
};

export const handleSubscriptionUpsert = async (
  event: SubscriptionWebhookEvent,
) => {
  const subscription = event.data.object;
  const subscriptionItem = subscription.items.data[0];
  if (!subscriptionItem) {
    throw new Error(`Stripe subscription has no items: ${subscription.id}`);
  }

  const { price } = subscriptionItem;
  if (!price.recurring) {
    throw new Error(`Stripe price is not recurring: ${price.id}`);
  }

  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, stripeCustomerId),
  });

  if (!dbUser) {
    if (event.type === "customer.subscription.deleted") {
      // Customer deletion cancels subscriptions after the local user is removed.
      return;
    }

    throw new Error(
      `Application user not found for Stripe customer: ${stripeCustomerId}`,
    );
  }

  const plan = getPlanForPriceId(price.id);
  const eventCreatedAt = new Date(event.created * 1000);

  await db
    .insert(subscriptions)
    .values({
      userId: dbUser.id,
      stripeEventId: event.id,
      stripeEventCreatedAt: eventCreatedAt,
      stripeSubscriptionId: subscription.id,
      plan,
      stripePriceId: price.id,
      status: subscription.status,
      recurringInterval: price.recurring.interval,
      currentPeriodStart: new Date(
        subscriptionItem.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeEventId: event.id,
        stripeEventCreatedAt: eventCreatedAt,
        stripeSubscriptionId: subscription.id,
        plan,
        stripePriceId: price.id,
        status: subscription.status,
        recurringInterval: price.recurring.interval,
        currentPeriodStart: new Date(
          subscriptionItem.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
      // Stripe can deliver webhooks out of order. Keep the newest event state.
      setWhere: sql`${subscriptions.stripeEventCreatedAt} <= ${sql.param(
        eventCreatedAt,
        subscriptions.stripeEventCreatedAt,
      )}`,
    });
};
