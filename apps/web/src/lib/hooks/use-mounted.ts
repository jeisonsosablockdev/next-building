/**
 * @file apps/web/src/lib/hooks/use-mounted.ts
 * @description Layer 2: Application / Consumption - Safe Hydration and Client Mount Hook.
 * Prevents SSR hydration mismatches by signaling when the component has mounted on the client.
 */

"use client";

import { useSyncExternalStore } from "react";

/**
 * Empty subscription handler since hydration status is static once mounted.
 *
 * @returns {() => void} Cleanup no-op function.
 */
const emptySubscribe = () => () => {};

/**
 * Hook that returns whether the current component has mounted on the client.
 * Uses `useSyncExternalStore` to avoid cascading render warnings and prevent hydration mismatch.
 *
 * @returns {boolean} True if the component has mounted in the browser, false during SSR.
 */
export function useMounted(): boolean {
  // Step 1: Subscribe to client hydration status via external store pattern
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
