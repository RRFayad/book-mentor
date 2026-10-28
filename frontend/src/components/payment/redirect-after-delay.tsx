"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { tw } from "@/lib/utils";

type RedirectAfterDelayProps = {
  href: Route;
  destination: string;
  delayMilliseconds?: number;
};

const styles = {
  message: tw("text-sm text-muted-foreground"),
  countdown: tw("font-semibold text-foreground"),
};

export const RedirectAfterDelay = ({
  href,
  destination,
  delayMilliseconds = 5000,
}: RedirectAfterDelayProps) => {
  const router = useRouter();
  const [remainingMilliseconds, setRemainingMilliseconds] =
    useState(delayMilliseconds);

  useEffect(() => {
    const startTime = Date.now();

    const intervalId = window.setInterval(() => {
      setRemainingMilliseconds(
        Math.max(delayMilliseconds - (Date.now() - startTime), 0),
      );
    }, 100);

    const timeoutId = window.setTimeout(() => {
      router.replace(href);
    }, delayMilliseconds);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [delayMilliseconds, href, router]);

  return (
    <p className={styles.message} role="status" aria-live="polite">
      Redirecting automatically to {destination} in{" "}
      <span className={styles.countdown}>
        {Math.ceil(remainingMilliseconds / 1000)} seconds
      </span>
      .
    </p>
  );
};
