import Link from "next/link";
import { CircleCheckBigIcon } from "lucide-react";

import { RedirectAfterDelay } from "@/components/payment/redirect-after-delay";
import { Button } from "@/components/ui/button";
import { featureFlags } from "@/lib/feature-flags";
import { routes } from "@/lib/routes";
import { tw } from "@/lib/utils";
import { redirect } from "next/navigation";

const styles = {
  page: tw("flex min-h-screen items-center justify-center bg-muted/20 px-4"),
  card: tw(
    "w-full max-w-md space-y-5 rounded-2xl border bg-card p-8 text-center shadow-sm",
  ),
  icon: tw("mx-auto size-10 text-primary"),
  heading: tw("text-3xl font-semibold tracking-tight"),
  description: tw("max-w-md text-muted-foreground"),
  action: tw("w-full"),
};

const Success = () => {
  if (!featureFlags.billingEnabled) {
    redirect(routes.appHome);
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <CircleCheckBigIcon className={styles.icon} />
        <h1 className={styles.heading}>Subscription confirmed.</h1>
        <p className={styles.description}>
          Your subscription is being synchronized. Your workspace will be ready
          shortly.
        </p>
        <Button className={styles.action} asChild>
          <Link href={routes.appHome}>Go to workspace now</Link>
        </Button>
        <RedirectAfterDelay
          href={routes.appHome}
          destination="your workspace"
        />
      </section>
    </main>
  );
};

export default Success;
