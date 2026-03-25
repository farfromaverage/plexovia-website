/**
 * Plexovia — Shared Framer Motion variants & utilities
 *
 * Uses a custom cubic-bezier easing that feels premium:
 * [0.25, 0.46, 0.45, 0.94] = similar to Apple's ease-out
 *
 * Always use `viewport: viewportConfig` on whileInView —
 * fires once, 80px before entering screen for smooth reveals.
 */

import type { Variants, Transition } from "framer-motion";

/* ── Easing ── */
export const ease = {
  out:    [0.25, 0.46, 0.45, 0.94] as const,
  inOut:  [0.45, 0.05, 0.55, 0.95] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  snappy: { type: "spring", stiffness: 450, damping: 35 } as Transition,
} as const;

/* ── Viewport config — fire once, start early ── */
export const viewportConfig = { once: true, margin: "-80px" } as const;

/* ── Fade up — universal scroll reveal ── */
export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: ease.out },
  },
};

/* ── Fade in from left ── */
export const fadeInLeft: Variants = {
  hidden:  { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: ease.out },
  },
};

/* ── Fade in from right ── */
export const fadeInRight: Variants = {
  hidden:  { opacity: 0, x: 28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: ease.out },
  },
};

/* ── Stagger children — parent wrapper ── */
export const stagger: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren:   0.05,
    },
  },
};

/* ── Stagger children (fast, for feature lists) ── */
export const staggerFast: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren:   0.02,
    },
  },
};

/* ── Scale on hover — cards, images ── */
export const scaleHover = {
  whileHover: { scale: 1.02 },
  whileTap:   { scale: 0.98 },
  transition: ease.snappy,
} as const;

/* ── Magnetic button — use with useMotionValue + useSpring ── */
export function getMagneticStrength(strength = 0.35) {
  return strength;
}

/* ── Path drawing — SVG line animations (How it Works connector) ── */
export const pathDraw: Variants = {
  hidden:  { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.4, ease: ease.inOut },
  },
};

/* ── Counter animation — numbers count up on entry ── */
export const counterReveal: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ease.out },
  },
};

/* ── Accordion spring — FAQ open/close ── */
export const accordionContent: Variants = {
  collapsed: {
    height:  0,
    opacity: 0,
    transition: { duration: 0.28, ease: ease.inOut },
  },
  expanded:  {
    height:  "auto",
    opacity: 1,
    transition: { duration: 0.32, ease: ease.out },
  },
};

/* ── Nav backdrop — appears on scroll ── */
export const navBackdrop: Variants = {
  transparent: { backgroundColor: "rgba(247,245,240,0)",  backdropFilter: "blur(0px)" },
  solid:       { backgroundColor: "rgba(247,245,240,0.88)", backdropFilter: "blur(16px)" },
};

/* ── Hero email mockup — parallax y offset ── */
export const heroParallaxConfig = {
  inputRange:  [0, 300],
  outputRange: [0, -45],
} as const;

/* ── 3D tilt on hover (final CTA section) ── */
export const tiltConfig = {
  max:        10,    /* max tilt degrees */
  scale:      1.02,
  speed:      400,
  perspective: 800,
} as const;
