import "server-only";

import { getBooleanEnvVar } from "@/lib/utils";

export const featureFlags = {
  landingPageEnabled: getBooleanEnvVar("LANDING_PAGE_ENABLED"),
  billingEnabled: getBooleanEnvVar("BILLING_ENABLED"),
} as const;
