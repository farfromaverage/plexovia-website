"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "./modalScrollLock";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    lockBodyScroll();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onCancel(); return; }
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlockBodyScroll();
    };
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "14px",
          padding: "1.75rem",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.55)",
          animation: "dash-modal-up 0.18s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "1.25rem" }}>
          <AlertTriangle
            size={20}
            color={danger ? "var(--danger)" : "var(--accent)"}
            style={{ flexShrink: 0, marginTop: 2 }}
            aria-hidden="true"
          />
          <div>
            <h3
              id="confirm-modal-title"
              style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--app-text)" }}
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              style={{ margin: "6px 0 0", fontSize: "0.875rem", color: "var(--app-muted)", lineHeight: 1.5 }}
            >
              {message}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            className="dash-btn"
            style={{ minHeight: 38 }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={danger ? "dash-btn dash-btn-danger" : "dash-btn dash-btn-accent"}
            style={{ minHeight: 38, fontWeight: 600 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
