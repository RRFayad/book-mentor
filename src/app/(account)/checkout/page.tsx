import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { StartCheckout } from "./start-checkout";
import { featureFlags } from "@/lib/feature-flags";
import { getAvailableStripePlans } from "@/lib/stripe/config";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";

type CheckoutPageProps = {
  searchParams: Promise<{ plan?: string | string[] }>;
};

const styles = {
  page: tw("flex min-h-screen items-center justify-center px-4"),
};

const CheckoutPage = async ({ searchParams }: CheckoutPageProps) => {
  if (!featureFlags.billingEnabled) {
    redirect(routes.appHome);
  }

  const { plan } = await searchParams;
  const selectedPlan =
    typeof plan === "string"
      ? getAvailableStripePlans().find(({ plan: id }) => id === plan)?.plan
      : undefined;

  if (!selectedPlan) {
    redirect(routes.pricing);
  }

  const { userId } = await auth();

  if (!userId) {
    redirect(routes.pricing);
  }

  return (
    <main className={styles.page}>
      <StartCheckout plan={selectedPlan} />
    </main>
  );
};

export default CheckoutPage;
