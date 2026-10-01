import { ArrowUpRightIcon, CalendarIcon } from "lucide-react";

import { customerPortal } from "@/actions/stripe";
import { PageHeader } from "@/components/subscribed/page-header";
import { Button } from "@/components/ui/button";
import { capitalize, tw } from "@/lib/utils";
import type { Subscription, SubscriptionPlan } from "@/types/database";

type BillingProps = {
  subscription: Subscription | null;
};

const planLabels: Record<SubscriptionPlan, string> = {
  basic: "Basic",
  premium: "Premium",
  all_in: "All In",
};

const formatDate = (date: Date | null): string => {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
};

const formatInterval = (interval: string): string =>
  interval.charAt(0).toUpperCase() + interval.slice(1);

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
  card: tw("rounded-xl border bg-card p-6 shadow-sm"),
  cardHeader: tw(
    "flex flex-col justify-between gap-4 sm:flex-row sm:items-start",
  ),
  cardTitle: tw("text-lg font-semibold"),
  status: tw("mt-2 flex items-center gap-2 text-sm text-muted-foreground"),
  statusDot: tw("size-2 rounded-full bg-emerald-500"),
  portalForm: tw("shrink-0"),
  details: tw("mt-8 grid gap-6 border-t pt-6 sm:grid-cols-3"),
  detailLabel: tw(
    "text-xs font-medium tracking-wide text-muted-foreground uppercase",
  ),
  detailValue: tw("mt-2 text-sm font-medium"),
  detailHint: tw("mt-1 text-xs text-muted-foreground"),
  notice: tw(
    "flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm",
  ),
  noticeIcon: tw("mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"),
  empty: tw("rounded-xl border border-dashed bg-muted/30 p-8 text-center"),
  emptyHeading: tw("font-medium"),
  emptyDescription: tw("mt-2 text-sm text-muted-foreground"),
};

export const Billing = ({ subscription }: BillingProps) => {
  if (!subscription) {
    return (
      <div className={styles.page}>
        <PageHeader title="Subscription and billing" />
        <div className={styles.empty}>
          <p className={styles.emptyHeading}>No current subscription</p>
          <p className={styles.emptyDescription}>
            Choose a plan to unlock billing management.
          </p>
        </div>
      </div>
    );
  }

  const periodLabel = subscription.cancelAtPeriodEnd ? "Access ends" : "Renews";

  return (
    <div className={styles.page}>
      <PageHeader
        title="Subscription and billing"
        description="Your subscription state is synchronized from Stripe and stored locally for authorization."
      />

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>
              {planLabels[subscription.plan]} plan
            </h2>
            <p className={styles.status}>
              <span className={styles.statusDot} />
              {capitalize(subscription.status)}
            </p>
          </div>
          <form action={customerPortal} className={styles.portalForm}>
            <Button type="submit">
              Manage billing
              <ArrowUpRightIcon />
            </Button>
          </form>
        </div>

        <div className={styles.details}>
          <div>
            <p className={styles.detailLabel}>Billing interval</p>
            <p className={styles.detailValue}>
              {formatInterval(subscription.recurringInterval)}
            </p>
            <p className={styles.detailHint}>Recurring subscription</p>
          </div>
          <div>
            <p className={styles.detailLabel}>Current period started</p>
            <p className={styles.detailValue}>
              {formatDate(subscription.currentPeriodStart)}
            </p>
            <p className={styles.detailHint}>Current billing period start</p>
          </div>
          <div>
            <p className={styles.detailLabel}>{periodLabel}</p>
            <p className={styles.detailValue}>
              {formatDate(subscription.currentPeriodEnd)}
            </p>
            <p className={styles.detailHint}>Current billing period end</p>
          </div>
        </div>
      </section>

      {subscription.cancelAtPeriodEnd && (
        <aside className={styles.notice}>
          <CalendarIcon className={styles.noticeIcon} />
          <p>
            Your subscription will not renew. You will keep access until{" "}
            {formatDate(subscription.currentPeriodEnd)}.
          </p>
        </aside>
      )}
    </div>
  );
};
