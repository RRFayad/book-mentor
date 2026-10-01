import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { featureFlags } from "@/lib/feature-flags";
import { deleteStripeCustomer, updateStripeCustomerEmail } from "@/lib/stripe";
import { getUserByClerkId } from "@/lib/user/user";
import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import type { DeletedObjectJSON, UserJSON } from "@clerk/nextjs/server";

const handleUserCreated = async (user: UserJSON) => {
  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  );

  if (!primaryEmail) {
    throw new Error("Primary email not found");
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");

  await db
    .insert(users)
    .values({
      clerkId: user.id,
      email: primaryEmail.email_address,
      name: name || null,
    })
    .onConflictDoNothing({
      target: users.clerkId,
    });
};

const handleUserUpdated = async (user: UserJSON) => {
  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  );

  if (!primaryEmail) {
    throw new Error("Primary email not found");
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const dbUser = await getUserByClerkId(user.id);

  if (
    featureFlags.billingEnabled &&
    dbUser?.stripeCustomerId &&
    dbUser.email !== primaryEmail.email_address
  ) {
    await updateStripeCustomerEmail(
      dbUser.stripeCustomerId,
      primaryEmail.email_address,
    );
  }

  await db
    .update(users)
    .set({
      email: primaryEmail.email_address,
      name: name || null,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, user.id));
};

const handleUserDeleted = async (user: DeletedObjectJSON) => {
  if (!user.id) {
    throw new Error("Deleted user ID not found");
  }

  const dbUser = await getUserByClerkId(user.id);

  if (featureFlags.billingEnabled && dbUser?.stripeCustomerId) {
    await deleteStripeCustomer(dbUser.stripeCustomerId);
  }

  await db.delete(users).where(eq(users.clerkId, user.id));
};

export const POST = async (req: NextRequest) => {
  try {
    const evt = await verifyWebhook(req);

    switch (evt.type) {
      case "user.created":
        await handleUserCreated(evt.data);
        break;

      case "user.updated":
        await handleUserUpdated(evt.data);
        break;

      case "user.deleted":
        await handleUserDeleted(evt.data);
        break;
    }

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Webhook processing failed:", error);

    return new Response("Invalid webhook", { status: 400 });
  }
};
