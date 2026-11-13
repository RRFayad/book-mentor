import { INTERRUPTED_AFTER_MINUTES } from "@app/shared/constants";

import type { Source } from "@/lib/backend/types";

const MINUTE = 60 * 1000;

export const isIngestionInterrupted = (
  source: Pick<Source, "state" | "createdAt">,
  now: Date,
): boolean => {
  const minutesSinceAdded =
    (now.getTime() - source.createdAt.getTime()) / MINUTE;

  return (
    source.state === "ingesting" &&
    minutesSinceAdded > INTERRUPTED_AFTER_MINUTES
  );
};
