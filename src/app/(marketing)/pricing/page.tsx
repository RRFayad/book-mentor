import { redirect } from "next/navigation";

import { PricingCards } from "@/components/marketing/pricing-cards";
import { featureFlags } from "@/lib/feature-flags";
import { routes } from "@/lib/routes";
import { getAvailableStripePlans } from "@/lib/stripe/config";
import {
  getCurrentUserSubscription,
  isSubscriptionActive,
} from "@/lib/subscription/subscription";
import { tw } from "@/lib/utils";

const styles = {
  page: tw("py-24"),
  content: tw("mx-auto max-w-6xl px-4 lg:px-8"),
  heading: tw("text-center text-4xl font-semibold tracking-tight"),
  description: tw("mx-auto mt-4 max-w-xl text-center text-muted-foreground"),
};

const PricingPage = async () => {
  if (!featureFlags.billingEnabled) {
    redirect(routes.workspace.overview);
  }

  const subscription = await getCurrentUserSubscription();

  if (isSubscriptionActive(subscription)) {
    redirect(routes.workspace.overview);
  }

  const plans = getAvailableStripePlans();

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Choose a plan to continue.</h1>
        <p className={styles.description}>
          Your subscription unlocks the dashboard and product features.
        </p>
        <PricingCards plans={plans} />
      </div>
    </main>
  );
};

export default PricingPage;
