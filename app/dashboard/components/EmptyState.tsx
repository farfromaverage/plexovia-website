"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, message, action }: Props) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      style={{
        padding: "3.5rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ color: "var(--app-faint)" }} aria-hidden="true">
        {icon}
      </div>
      <p style={{
        fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-text-secondary)",
        margin: 0, lineHeight: 1.35,
      }}>
        {title}
      </p>
      <p style={{
        fontSize: "0.8125rem",
        color: "var(--app-muted)",
        margin: 0,
        maxWidth: 400,
        lineHeight: 1.6,
        whiteSpace: "pre-line",
      }}>
        {message}
      </p>
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </motion.div>
  );
}
