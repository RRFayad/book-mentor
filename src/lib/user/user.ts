import "server-only";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@/types/database";

export const getUserByClerkId = async (
  clerkId: string,
): Promise<User | null> => {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  return user ?? null;
};

export const getOrCreateUserByClerkId = async (
  clerkId: string,
): Promise<User | null> => {
  const existingUser = await getUserByClerkId(clerkId);

  if (existingUser) {
    return existingUser;
  }

  // Checkout can start before Clerk's user.created webhook reaches the database.
  const clerkUser = await currentUser();

  if (!clerkUser || clerkUser.id !== clerkId) {
    return null;
  }

  const primaryEmail = clerkUser.primaryEmailAddress;

  if (!primaryEmail) {
    throw new Error("Primary email not found");
  }

  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  const [createdUser] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email: primaryEmail.emailAddress,
      name: name || null,
    })
    .onConflictDoNothing({
      target: users.clerkId,
    })
    .returning();

  return createdUser ?? getUserByClerkId(clerkId);
};

export const addStripeCustomerIdToUserDb = async (
  user: User,
  stripeCustomerId: string,
): Promise<User> => {
  const [updatedUser] = await db
    .update(users)
    .set({ stripeCustomerId })
    .where(eq(users.id, user.id))
    .returning();

  return updatedUser;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  return getUserByClerkId(clerkId);
};
