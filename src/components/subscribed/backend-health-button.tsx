"use client";

import { useTransition } from "react";
import { ActivityIcon } from "lucide-react";

import { checkBackendHealth } from "@/actions/backend";
import { showToast } from "@/components/toaster";
import { Button } from "@/components/ui/button";

// Demo: a client button calls a server action and turns its result into a toast.
export const BackendHealthButton = () => {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await checkBackendHealth();

      if (result.ok) {
        showToast({
          type: "success",
          title: "FastAPI is healthy",
          message: `The health check returned "${result.status}".`,
        });
      } else {
        showToast({
          type: "error",
          title: "FastAPI is unreachable",
          message: result.error,
        });
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      <ActivityIcon />
      {pending ? "Checking…" : "Check FastAPI"}
    </Button>
  );
};
