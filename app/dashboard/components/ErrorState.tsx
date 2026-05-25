"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: Props) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      style={{
        padding: "3rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--danger-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <AlertCircle size={22} style={{ color: "var(--danger)" }} aria-hidden="true" />
      </div>
      <p style={{
        fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-text-secondary)",
        margin: 0, lineHeight: 1.35,
      }}>
        Unable to load contracts
      </p>
      <p style={{
        color: "var(--app-muted)",
        fontSize: "0.8125rem",
        margin: 0,
        maxWidth: 380,
        lineHeight: 1.6,
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="dash-btn"
          style={{ marginTop: "var(--space-1)", minHeight: 36 }}
        >
          Try again
        </button>
      )}
    </motion.div>
  );
}
