/**
 * @file apps/web/src/app/providers.tsx
 * @description Layer 1: Presentation - Application Root Context Providers.
 * Bundles global client-side providers such as Motion animation context.
 */

"use client";

import React from "react";
import { MotionProvider } from "@/components/motion/motion-provider";

/**
 * Props for the root Providers wrapper.
 */
export interface ProvidersProps {
  /** Child component subtree to receive wrapped contexts */
  children: React.ReactNode;
}

/**
 * Application root providers component wrapping all client context hierarchies.
 *
 * @param {ProvidersProps} props - Component properties.
 * @returns {React.ReactElement} Provider-wrapped tree.
 */
export function Providers({ children }: ProvidersProps) {
  // Step 1: Render layered context providers
  return <MotionProvider>{children}</MotionProvider>;
}

