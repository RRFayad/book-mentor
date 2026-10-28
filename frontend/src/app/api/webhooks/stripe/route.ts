import Stripe from "stripe";

import { NextRequest, NextResponse } from "next/server";
import { featureFlags } from "@/lib/feature-flags";
import { getEnvVar } from "@/lib/utils";
import { handleSubscriptionUpsert } from "@/lib/stripe/webhook-handlers";

export const POST = async (req: NextRequest) => {
  if (!featureFlags.billingEnabled) {
    return new NextResponse(null, { status: 404 });
  }

  const payload = await req.text();
  const webhookSecret = getEnvVar("STRIPE_WEBHOOK_SECRET");

  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
    case "customer.subscription.deleted":
      await handleSubscriptionUpsert(event);
      break;

    default:
      console.warn(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
};
