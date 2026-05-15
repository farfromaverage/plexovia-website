"use client";
import { Clock } from "lucide-react";

// Reusable "Coming Soon" placeholder — works inside the shared DashboardLayout.
// The layout already provides the sidebar nav, so no header/back-link needed here.
export default function ComingSoon() {
  return (
    <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "var(--accent-subtle)",
          border: "1px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          <Clock size={24} color="var(--accent)" aria-hidden="true" />
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "1.375rem", color: "var(--app-text)", margin: "0 0 0.5rem", letterSpacing: "-0.03em" }}>
          Coming soon
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--app-muted)", lineHeight: 1.6, margin: 0 }}>
          This feature is being built and will be available before your trial ends.
        </p>
      </div>
    </div>
  );
}
