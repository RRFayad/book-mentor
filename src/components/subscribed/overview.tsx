import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CreditCardIcon,
  MousePointerClickIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { PageHeader } from "@/components/subscribed/page-header";
import { BackendHealthButton } from "@/components/subscribed/backend-health-button";
import type { DashboardData } from "@/lib/backend/dashboard";
import { tw } from "@/lib/utils";

type OverviewProps = {
  dashboardData: DashboardData | null;
};

const metricIcons = {
  revenue: TrendingUpIcon,
  customers: UsersIcon,
  conversion: MousePointerClickIcon,
  refunds: CreditCardIcon,
};

const styles = {
  page: tw("mx-auto w-full max-w-7xl space-y-8"),
  headerActions: tw("flex items-center gap-3"),
  sampleBadge: tw(
    "w-fit rounded-full border border-dashed bg-muted/60 px-3 py-1 text-xs text-muted-foreground",
  ),
  metrics: tw("grid gap-4 sm:grid-cols-2 xl:grid-cols-4"),
  metricCard: tw("rounded-xl border bg-card p-5 shadow-sm"),
  metricHeader: tw("flex items-start justify-between gap-4"),
  metricLabel: tw("text-sm text-muted-foreground"),
  metricIcon: tw("size-4 text-primary"),
  metricValue: tw("mt-4 text-2xl font-semibold tracking-tight"),
  metricChange: tw("mt-2 flex items-center gap-1 text-xs font-medium"),
  positiveChange: tw("text-emerald-600 dark:text-emerald-400"),
  negativeChange: tw("text-rose-600 dark:text-rose-400"),
  changeIcon: tw("size-3"),
  contentGrid: tw(
    "grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]",
  ),
  panel: tw("rounded-xl border bg-card p-6 shadow-sm"),
  panelHeader: tw("flex items-start justify-between gap-4"),
  panelTitle: tw("text-base font-semibold"),
  panelDescription: tw("mt-1 text-sm text-muted-foreground"),
  chartTotal: tw("text-right text-sm font-medium"),
  chartTotalLabel: tw("block text-xs font-normal text-muted-foreground"),
  chart: tw("mt-8 flex h-56 items-end gap-3"),
  chartColumn: tw("flex h-full flex-1 flex-col justify-end gap-2"),
  chartBar: tw("rounded-t-md bg-primary/80 transition-colors hover:bg-primary"),
  chartLabel: tw("text-center text-xs text-muted-foreground"),
  activityList: tw("mt-5 divide-y"),
  activityRow: tw(
    "flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0",
  ),
  activityCustomer: tw("text-sm font-medium"),
  activityAction: tw("mt-1 text-xs text-muted-foreground"),
  activityAmount: tw(
    "text-sm font-medium text-emerald-600 dark:text-emerald-400",
  ),
  unavailable: tw(
    "rounded-xl border border-dashed bg-muted/30 p-8 text-center",
  ),
  unavailableHeading: tw("font-medium"),
  unavailableDescription: tw("mt-2 text-sm text-muted-foreground"),
};

export const Overview = ({ dashboardData }: OverviewProps) => {
  const description = dashboardData
    ? `This mock dashboard data was fetched from FastAPI. The included account email, ${dashboardData.user_email}, confirms FastAPI is working and can read the application database.`
    : "FastAPI could not return the sample dashboard data.";

  return (
    <div className={styles.page}>
      <PageHeader
        title="Your business at a glance"
        description={description}
        action={
          <div className={styles.headerActions}>
            <BackendHealthButton />
            <span className={styles.sampleBadge}>Sample data</span>
          </div>
        }
      />

      {dashboardData ? (
        <>
          <section className={styles.metrics} aria-label="Sample metrics">
            {dashboardData.metrics.map((metric) => {
              const MetricIcon = metricIcons[metric.icon];
              const ChangeIcon = metric.positive
                ? ArrowUpRightIcon
                : ArrowDownRightIcon;

              return (
                <article key={metric.label} className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <p className={styles.metricLabel}>{metric.label}</p>
                    <MetricIcon className={styles.metricIcon} />
                  </div>
                  <p className={styles.metricValue}>{metric.value}</p>
                  <p
                    className={`${styles.metricChange} ${metric.positive ? styles.positiveChange : styles.negativeChange}`}
                  >
                    <ChangeIcon className={styles.changeIcon} />
                    {metric.change} from last month
                  </p>
                </article>
              );
            })}
          </section>

          <section className={styles.contentGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Revenue activity</h2>
                  <p className={styles.panelDescription}>Last 7 days</p>
                </div>
                <p className={styles.chartTotal}>
                  {dashboardData.revenue_activity.total}
                  <span className={styles.chartTotalLabel}>Sample total</span>
                </p>
              </div>
              <div className={styles.chart}>
                {dashboardData.revenue_activity.points.map((point) => (
                  <div key={point.label} className={styles.chartColumn}>
                    <div
                      aria-label={`${point.label}: ${point.value}%`}
                      className={styles.chartBar}
                      style={{ height: `${point.value}%` }}
                    />
                    <span className={styles.chartLabel}>{point.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <div>
                <h2 className={styles.panelTitle}>Recent activity</h2>
                <p className={styles.panelDescription}>Latest sample events</p>
              </div>
              <div className={styles.activityList}>
                {dashboardData.recent_activity.map((item) => (
                  <div
                    key={`${item.customer}-${item.action}`}
                    className={styles.activityRow}
                  >
                    <div>
                      <p className={styles.activityCustomer}>{item.customer}</p>
                      <p className={styles.activityAction}>{item.action}</p>
                    </div>
                    <span className={styles.activityAmount}>{item.amount}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : (
        <section className={styles.unavailable}>
          <p className={styles.unavailableHeading}>
            Dashboard data is unavailable
          </p>
          <p className={styles.unavailableDescription}>
            The FastAPI service could not return the sample dashboard data.
          </p>
        </section>
      )}
    </div>
  );
};
