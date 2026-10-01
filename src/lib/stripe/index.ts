import "server-only";

import Stripe from "stripe";
import type { User } from "@/types/database";
import { getEnvVar, getErrorMessageAndThrow } from "../utils";
import { addStripeCustomerIdToUserDb } from "../user/user";

const stripeDiscountCoupon = getEnvVar("STRIPE_DEMO_COUPON_ID", false);
let stripeClient: Stripe | undefined;

const getStripe = (): Stripe => {
  stripeClient ??= new Stripe(getEnvVar("STRIPE_SECRET_KEY"));

  return stripeClient;
};

export const createStripeCustomer = async (user: User) => {
  const stripeCustomer = await getStripe().customers.create(
    {
      email: user.email,
      metadata: {
        userId: user.id.toString(),
        clerkId: user.clerkId,
      },
    },
    {
      idempotencyKey: `customer-${user.id}`,
    },
  );
  return stripeCustomer;
};

export const deleteStripeCustomer = async (customerId: string) => {
  await getStripe().customers.del(customerId);
};

export const updateStripeCustomerEmail = async (
  customerId: string,
  email: string,
) => {
  await getStripe().customers.update(customerId, { email });
};

export const createStripeCheckoutSession = async ({
  priceId,
  user,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  user: User;
  successUrl: string;
  cancelUrl?: string;
}) => {
  let updatedUser;

  if (!user.stripeCustomerId) {
    try {
      const customer = await createStripeCustomer(user);
      updatedUser = await addStripeCustomerIdToUserDb(user, customer.id);
    } catch (error) {
      getErrorMessageAndThrow(
        "Failed to add Stripe Customer to create checkout",
        error,
      );
    }
  }

  const customerId = (user.stripeCustomerId || updatedUser?.stripeCustomerId)!;

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",

    payment_method_collection: stripeDiscountCoupon ? "if_required" : "always",

    payment_method_types: ["card"],
    billing_address_collection: "auto",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_update: { name: "auto", address: "auto" },
    success_url: successUrl,
    cancel_url: cancelUrl || `/`,
    discounts: [{ coupon: stripeDiscountCoupon }],
  });

  if (!session.url) {
    throw new Error("Stripe checkout session URL is missing");
  }

  return session.url;
};

export const createStripeCustomerPortalSession = async ({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) => {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  if (!session.url) {
    throw new Error("Stripe customer portal session URL is missing");
  }

  return session.url;
};
