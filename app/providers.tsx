"use client";

import { MotionConfig } from "framer-motion";
import { ReactLenis }   from "lenis/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_placeholder", {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // Disabling automatic pageview capture, as we usually capture it manually inside Next.js components/hooks
    capture_pageleave: true,
  });
}

/**
 * Providers — thin Client Component wrapper around the app root.
 *
 * Keeps layout.tsx as a Server Component (critical for RSC streaming)
 * while giving child trees access to:
 *   - MotionConfig: honours prefers-reduced-motion system preference
 *   - ReactLenis:   hardware-accelerated smooth scroll
 *   - PostHogProvider: global analytics tracking
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <MotionConfig reducedMotion="user">
        <ReactLenis root options={{ lerp: 0.08, duration: 1.2 }}>
          {children}
        </ReactLenis>
      </MotionConfig>
    </PostHogProvider>
  );
}
