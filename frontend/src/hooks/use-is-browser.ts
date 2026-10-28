import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

// False on the server and during hydration, true afterwards. Use it for
// anything that depends on the user's local time, which the server does not
// know, so the server HTML and the first browser render always match.
export const useIsBrowser = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
