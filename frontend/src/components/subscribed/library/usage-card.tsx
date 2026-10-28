import type { Usage } from "@/lib/backend/types";
import { cn, tw } from "@/lib/utils";

const styles = {
  card: tw("grid gap-6 rounded-xl border bg-card p-6 shadow-sm sm:grid-cols-3"),
  item: tw("min-w-0 space-y-2"),
  label: tw(
    "text-xs font-medium tracking-wide text-muted-foreground uppercase",
  ),
  value: tw("text-sm font-medium"),
  track: tw("h-1.5 overflow-hidden rounded-full bg-muted"),
  fill: tw("h-full rounded-full"),
  fillNormal: tw("bg-primary"),
  fillFull: tw("bg-warning"),
  hint: tw("text-xs text-muted-foreground"),
};

type MeterProps = {
  label: string;
  used: number;
  limit: number;
  hint: string;
};

const Meter = ({ label, used, limit, hint }: MeterProps) => {
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className={styles.item}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>
        {used} of {limit}
      </p>
      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
      >
        <div
          className={cn(
            styles.fill,
            used >= limit ? styles.fillFull : styles.fillNormal,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={styles.hint}>{hint}</p>
    </div>
  );
};

export const UsageCard = ({ usage }: { usage: Usage }) => {
  return (
    <section aria-label="Usage" className={styles.card}>
      <Meter
        label="Active Sources"
        used={usage.activeSources}
        limit={usage.sourceLimit}
        hint="Delete a Source to free a slot."
      />
      <Meter
        label="Messages, last 24 hours"
        used={usage.messagesInWindow}
        limit={usage.messageLimit}
        hint="Across all your Conversations."
      />
      <div className={styles.item}>
        <p className={styles.label}>Expiry</p>
        <p className={styles.value}>7 days after adding</p>
        <p className={styles.hint}>
          Sources are deleted 7 days after you add them. Conversations stay.
        </p>
      </div>
    </section>
  );
};
