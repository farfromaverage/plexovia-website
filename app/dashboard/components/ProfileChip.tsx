"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";

type ChipVariant = "accent" | "neutral" | "danger";

interface Props {
  label: string;
  onRemove: () => void;
  variant?: ChipVariant;
  monospace?: boolean;
  subLabel?: string;
}

const variantStyles: Record<ChipVariant, { bg: string; border: string; fg: string }> = {
  accent:  { bg: "var(--accent-subtle)", border: "var(--accent-border)", fg: "var(--accent)" },
  neutral: { bg: "var(--app-surface-2)", border: "var(--app-border)", fg: "var(--app-text)" },
  danger:  { bg: "var(--danger-subtle)", border: "rgba(194,59,59,0.2)", fg: "var(--danger)" },
};

export default function ProfileChip({ label, onRemove, variant = "accent", monospace = false, subLabel }: Props) {
  const s = variantStyles[variant];

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "999px",
        padding: "4px 12px",
        fontSize: "0.8rem",
        fontFamily: monospace ? "var(--font-geist-mono, monospace)" : "inherit",
        color: s.fg,
        lineHeight: 1.4,
      }}
    >
      {label}
      {subLabel && (
        <span style={{ fontSize: "0.7rem", opacity: 0.7, fontFamily: "var(--font-inter, sans-serif)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {subLabel}
        </span>
      )}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          opacity: 0.55,
          padding: 0,
          display: "flex",
          lineHeight: 1,
          marginLeft: 1,
        }}
      >
        <X size={12} aria-hidden="true" />
      </button>
    </motion.span>
  );
}
