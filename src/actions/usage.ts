"use server";

import { getUsage } from "@/lib/backend/usage";
import type { Usage } from "@/lib/backend/types";
import { canCurrentUserUseSubscriptionPlan } from "@/lib/subscription/subscription";
import { SubscriptionPlan } from "@/types/database";

export const getUsageAction = async (): Promise<Usage | null> => {
  const canUse = await canCurrentUserUseSubscriptionPlan(
    SubscriptionPlan.Basic,
  );

  return canUse ? getUsage() : null;
};
