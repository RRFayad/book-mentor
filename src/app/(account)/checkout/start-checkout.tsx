"use client";

import { startTransition, useEffect, useRef } from "react";

import { checkout } from "@/actions/stripe";
import type { SubscriptionPlan } from "@/types/database";
import { tw } from "@/lib/utils";

type StartCheckoutProps = {
  plan: SubscriptionPlan;
};

const styles = {
  message: tw("text-sm text-muted-foreground"),
};

export const StartCheckout = ({ plan }: StartCheckoutProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const hasStartedCheckout = useRef(false);

  useEffect(() => {
    if (hasStartedCheckout.current) {
      return;
    }

    hasStartedCheckout.current = true;
    startTransition(() => formRef.current?.requestSubmit());
  }, []);

  return (
    <form action={checkout} ref={formRef}>
      <input name="plan" type="hidden" value={plan} />
      <p className={styles.message}>Redirecting to secure checkout...</p>
    </form>
  );
};
