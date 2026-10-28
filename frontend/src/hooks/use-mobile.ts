import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const subscribe = (onStoreChange: () => void): (() => void) => {
  const mediaQuery = window.matchMedia(
    `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
  );

  mediaQuery.addEventListener("change", onStoreChange);

  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getSnapshot = (): boolean => window.innerWidth < MOBILE_BREAKPOINT;

const getServerSnapshot = (): boolean => false;

export const useIsMobile = (): boolean =>
  React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
