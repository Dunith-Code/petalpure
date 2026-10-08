"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false while rendering on the server and during hydration, true afterwards in the browser */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}