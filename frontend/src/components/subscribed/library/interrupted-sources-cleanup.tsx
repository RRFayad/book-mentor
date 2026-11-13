"use client";

import { useEffect, useRef } from "react";

import { deleteSourceAction } from "@/actions/sources";
import { showToast } from "@/components/toaster";
import type { Source } from "@/lib/backend/types";

// Deletes books whose sending was interrupted, once, so they don't stay
// "Ingesting" in the Library and take a slot. Renders nothing.
export const InterruptedSourcesCleanup = ({
  sources,
}: {
  sources: Source[];
}) => {
  const cleanedRef = useRef(false);

  useEffect(() => {
    if (cleanedRef.current || sources.length === 0) {
      return;
    }

    cleanedRef.current = true;

    sources.forEach(async (source) => {
      const { ok } = await deleteSourceAction(source.id);

      if (ok) {
        showToast({
          type: "warning",
          title: `Adding ${source.title} was interrupted.`,
          message: "The tab closed before it finished. Add it again.",
        });
      }
    });
  }, [sources]);

  return null;
};
