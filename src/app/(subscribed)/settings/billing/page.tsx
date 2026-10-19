import { Billing } from "@/components/subscribed/billing";
import { featureFlags } from "@/lib/feature-flags";
import { routes } from "@/lib/routes";
import {
  getCurrentUserSubscription,
  requireCurrentUserSubscriptionPlan,
} from "@/lib/subscription/subscription";
import { tw } from "@/lib/utils";
import { redirect } from "next/navigation";

const styles = {
  page: tw("w-full"),
};

const BillingPage = async () => {
  if (!featureFlags.billingEnabled) {
    redirect(routes.workspace.overview);
  }

  await requireCurrentUserSubscriptionPlan("basic");

  const subscription = await getCurrentUserSubscription();

  return (
    <main className={styles.page}>
      <Billing subscription={subscription} />
    </main>
  );
};

export default BillingPage;
