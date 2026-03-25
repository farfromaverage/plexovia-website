"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────
   Plexovia Card
   Ambient shadow · 12px radius · hover elevation lift
   Two variants:
     parchment — for public pages (#FFFFFF card on #F7F5F0)
     dark      — for dashboard  (#1A1917 card on #111110)
────────────────────────────────────────────────── */

interface CardProps {
  children:  React.ReactNode;
  className?: string;
  surface?:  "parchment" | "dark";
  hoverable?: boolean;
  as?: "div" | "article" | "section" | "li";
}

export default function Card({
  children,
  className,
  surface   = "parchment",
  hoverable = true,
  as: Tag   = "div",
}: CardProps) {
  const base = cn(
    "rounded-[12px] border",
    "transition-shadow duration-300",
    surface === "parchment"
      ? "bg-[var(--pub-surface)] border-[var(--pub-border)]"
      : "bg-[var(--app-surface)] border-[var(--app-border)]",
    className
  );

  if (!hoverable) {
    return <Tag className={base}>{children}</Tag>;
  }

  return (
    <motion.div
      className={base}
      style={{
        boxShadow:
          surface === "parchment"
            ? "0 4px 24px -6px rgba(28,25,23,0.06)"
            : "0 4px 24px -6px rgba(0,0,0,0.24)",
      }}
      whileHover={{
        y: -3,
        boxShadow:
          surface === "parchment"
            ? "0 12px 40px -10px rgba(28,25,23,0.12)"
            : "0 12px 40px -10px rgba(0,0,0,0.40)",
        transition: { type: "spring", stiffness: 350, damping: 26 },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Sub-components for structured card layouts ── */

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pt-6 pb-4", className)}>{children}</div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pb-6", className)}>{children}</div>
  );
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-[var(--pub-border)] rounded-b-[12px]",
        className
      )}
    >
      {children}
    </div>
  );
}
