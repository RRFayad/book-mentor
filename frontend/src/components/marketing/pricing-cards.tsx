import { SignUpButton, Show } from "@clerk/nextjs";
import { CheckIcon } from "lucide-react";

import { checkout } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/velora/border-beam";
import { BlurFade } from "@/components/velora/blur-fade";
import { ShimmerButton } from "@/components/velora/shimmer-button";
import type { AvailableStripePlan } from "@/lib/stripe/config";
import { tw } from "@/lib/utils";

type PricingCardsProps = {
  plans: AvailableStripePlan[];
};

const styles = {
  grid: tw("mx-auto mt-16 grid gap-6"),
  onePlan: tw("max-w-sm"),
  twoPlans: tw("max-w-4xl md:grid-cols-2"),
  threePlans: tw("max-w-6xl md:grid-cols-2 xl:grid-cols-3"),
  card: tw("flex h-full flex-col rounded-2xl border bg-card p-8"),
  popularCard: tw(
    "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-8",
  ),
  header: tw("flex items-center justify-between"),
  planName: tw("text-lg font-semibold"),
  popularPlanName: tw("text-lg font-semibold text-primary"),
  popularBadge: tw(
    "rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary",
  ),
  description: tw("mt-2 text-sm text-muted-foreground"),
  price: tw("mt-6 text-5xl font-semibold tracking-tight"),
  interval: tw("text-base font-normal text-muted-foreground"),
  features: tw("mt-8 flex-1 space-y-3 text-sm"),
  feature: tw("flex items-center gap-3"),
  featureIcon: tw(
    "flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary",
  ),
  checkIcon: tw("size-3"),
  button: tw("mt-8 w-full rounded-full"),
  popularButton: tw("mt-8 w-full"),
};

const getGridStyles = (planCount: number): string => {
  if (planCount === 1) {
    return `${styles.grid} ${styles.onePlan}`;
  }

  if (planCount === 2) {
    return `${styles.grid} ${styles.twoPlans}`;
  }

  return `${styles.grid} ${styles.threePlans}`;
};

const getCheckoutRoute = (plan: AvailableStripePlan["plan"]): string =>
  `/checkout?plan=${plan}`;

export const PricingCards = ({ plans }: PricingCardsProps) => {
  return (
    <div className={getGridStyles(plans.length)}>
      {plans.map((plan, index) => (
        <BlurFade key={plan.plan} delay={index * 0.12}>
          <div
            className={plan.isMostPopular ? styles.popularCard : styles.card}
          >
            {plan.isMostPopular && <BorderBeam size={80} duration={8} />}
            <div className={styles.header}>
              <h3
                className={
                  plan.isMostPopular ? styles.popularPlanName : styles.planName
                }
              >
                {plan.name}
              </h3>
              {plan.isMostPopular && (
                <span className={styles.popularBadge}>Most popular</span>
              )}
            </div>
            <p className={styles.description}>{plan.description}</p>
            <p className={styles.price}>
              {plan.displayPrice}
              <span className={styles.interval}> {plan.interval}</span>
            </p>
            <ul className={styles.features}>
              {plan.features.map((feature) => (
                <li key={feature} className={styles.feature}>
                  <span className={styles.featureIcon}>
                    <CheckIcon className={styles.checkIcon} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Show when="signed-out">
              <SignUpButton
                forceRedirectUrl={getCheckoutRoute(plan.plan)}
                signInForceRedirectUrl={getCheckoutRoute(plan.plan)}
              >
                {plan.isMostPopular ? (
                  <ShimmerButton className={styles.popularButton}>
                    Get started
                  </ShimmerButton>
                ) : (
                  <Button className={styles.button} size="lg" variant="outline">
                    Get started
                  </Button>
                )}
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <form action={checkout}>
                <input name="plan" type="hidden" value={plan.plan} />
                {plan.isMostPopular ? (
                  <ShimmerButton className={styles.popularButton}>
                    Get started
                  </ShimmerButton>
                ) : (
                  <Button
                    className={styles.button}
                    size="lg"
                    type="submit"
                    variant="outline"
                  >
                    Get started
                  </Button>
                )}
              </form>
            </Show>
          </div>
        </BlurFade>
      ))}
    </div>
  );
};
