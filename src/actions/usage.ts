"use server";

import { getUsage } from "@/lib/backend/usage";
import type { Usage } from "@/lib/backend/types";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";

export const getUsageAction = async (): Promise<Usage | null> => {
  const canUse = await canCurrentUserUseSubscriptionPlan("basic");

  return canUse ? getUsage() : null;
};
