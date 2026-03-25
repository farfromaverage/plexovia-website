"use client";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export default function ComingSoon() {
  return (
    <div style={{ minHeight: "100vh", background: "#1C1917", display: "flex", flexDirection: "column", fontFamily: "var(--font-inter), sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #252320", padding: "0 2rem", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.05em" }}>
            <span style={{ color: "#C9A84C" }}>P</span><span style={{ color: "#F7F5F0" }}>lexovia</span>
          </span>
        </Link>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#6B6560", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </header>
      {/* Body */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "380px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#C9A84C18", border: "1px solid #C9A84C30", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Clock size={24} color="#C9A84C" />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", color: "#F7F5F0", margin: "0 0 0.5rem", letterSpacing: "-0.03em" }}>Coming soon</h1>
          <p style={{ fontSize: "0.9375rem", color: "#6B6560", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
            This feature is being built. It will be live before your trial ends.
          </p>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 22px", background: "#C9A84C", color: "#1C1917", borderRadius: "9px", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
