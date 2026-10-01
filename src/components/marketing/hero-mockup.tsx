"use client";

import { motion } from "motion/react";
import {
  BarChart3Icon,
  CreditCardIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { BorderBeam } from "@/components/velora/border-beam";
import { BrowserMockup } from "@/components/velora/browser-mockup";
import { NumberTicker } from "@/components/velora/number-ticker";
import { routes } from "@/lib/routes";
import { cn, tw } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboardIcon, label: "Overview", active: true },
  { icon: BarChart3Icon, label: "Analytics" },
  { icon: UsersIcon, label: "Customers" },
  { icon: CreditCardIcon, label: "Billing" },
  { icon: SettingsIcon, label: "Settings" },
];

const stats = [
  { label: "Revenue", value: 48291, prefix: "$", change: "+12.4%" },
  { label: "Active users", value: 12480, prefix: "", change: "+8.1%" },
  {
    label: "Conversion",
    value: 4.6,
    prefix: "",
    change: "+0.9%",
    decimals: 1,
    suffix: "%",
  },
];

const bars = [38, 62, 48, 74, 56, 88, 66, 92, 60, 78, 84, 98];

const styles = {
  root: tw("relative mx-auto w-full max-w-5xl"),
  glow: tw(
    "absolute -inset-8 rounded-[2rem] bg-gradient-to-r from-brand-from via-brand-via to-brand-to opacity-20 blur-3xl",
  ),
  browser: tw("relative"),
  dashboard: tw("flex"),
  sidebar: tw(
    "hidden w-44 flex-col gap-1 border-r border-border/60 p-3 md:flex",
  ),
  sidebarItem: tw("flex items-center gap-2 rounded-lg px-3 py-2 text-xs"),
  sidebarItemActive: tw("bg-primary/10 font-medium text-primary"),
  sidebarItemInactive: tw("text-muted-foreground"),
  sidebarIcon: tw("size-3.5"),
  content: tw("flex-1 p-4 lg:p-6"),
  contentHeader: tw("mb-4 flex items-center justify-between"),
  contentTitle: tw("text-sm font-semibold"),
  period: tw(
    "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground",
  ),
  statsGrid: tw("grid grid-cols-3 gap-3"),
  statCard: tw(
    "rounded-xl border border-border/60 bg-background/40 p-3 lg:p-4",
  ),
  statLabel: tw("text-[11px] text-muted-foreground"),
  statValue: tw("mt-1 text-base font-semibold lg:text-xl"),
  statChange: tw(
    "mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-500",
  ),
  statChangeIcon: tw("size-3"),
  chart: tw("mt-3 rounded-xl border border-border/60 bg-background/40 p-4"),
  chartHeader: tw("mb-3 flex items-center justify-between"),
  chartTitle: tw("text-xs font-medium"),
  chartYear: tw("text-[11px] text-muted-foreground"),
  chartBars: tw("flex h-32 items-end gap-2 lg:h-40"),
  chartBar: tw(
    "flex-1 origin-bottom rounded-t-sm bg-gradient-to-t from-brand-from to-brand-via",
  ),
};

/**
 * Fake analytics dashboard inside a browser frame — pure markup,
 * no images. Gives the hero a product to look at.
 */
export const HeroMockup = ({ className }: { className?: string }) => {
  return (
    <div className={cn(styles.root, className)}>
      {/* Glow */}
      <div aria-hidden className={styles.glow} />

      <BrowserMockup
        url={`starter-kit${routes.workspace.overview}`}
        className={styles.browser}
      >
        <BorderBeam size={96} duration={10} />

        <div className={styles.dashboard}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {navItems.map((item) => (
              <span
                key={item.label}
                className={cn(
                  styles.sidebarItem,
                  item.active
                    ? styles.sidebarItemActive
                    : styles.sidebarItemInactive,
                )}
              >
                <item.icon className={styles.sidebarIcon} />
                {item.label}
              </span>
            ))}
          </aside>

          {/* Main */}
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <span className={styles.contentTitle}>Overview</span>
              <span className={styles.period}>Last 30 days</span>
            </div>

            {/* Stat cards */}
            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.statCard}>
                  <p className={styles.statLabel}>{stat.label}</p>
                  <p className={styles.statValue}>
                    <NumberTicker
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix ?? ""}
                      decimalPlaces={stat.decimals ?? 0}
                    />
                  </p>
                  <span className={styles.statChange}>
                    <TrendingUpIcon className={styles.statChangeIcon} />
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className={styles.chart}>
              <div className={styles.chartHeader}>
                <span className={styles.chartTitle}>Monthly revenue</span>
                <span className={styles.chartYear}>2026</span>
              </div>
              <div className={styles.chartBars}>
                {bars.map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.3 + i * 0.05,
                      duration: 0.5,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className={styles.chartBar}
                    style={{
                      height: `${height}%`,
                      opacity: 0.5 + height / 200,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </BrowserMockup>
    </div>
  );
};
