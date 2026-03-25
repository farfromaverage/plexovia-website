"use client";

import { MotionConfig } from "framer-motion";
import { ReactLenis }   from "lenis/react";

/**
 * Providers — thin Client Component wrapper around the app root.
 *
 * Keeps layout.tsx as a Server Component (critical for RSC streaming)
 * while giving child trees access to:
 *   - MotionConfig: honours prefers-reduced-motion system preference
 *   - ReactLenis:   hardware-accelerated smooth scroll
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.08, duration: 1.2 }}>
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
