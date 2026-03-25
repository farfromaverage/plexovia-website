"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2, AlertCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (err) {
      // Only show an error for non-user-related failures (rate limit, network)
      if (err.status !== 422) setError(err.message);
    }

    // Always show success (never confirm whether email exists — security)
    setSent(true);
  }

  /* ── Success state ── */
  if (sent) {
    return (
      <div style={page}>
        <Wordmark />
        <div style={card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1E2A1E", border: "1px solid #2D5A2D", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Mail size={22} color="#4ADE80" />
            </div>
            <h1 style={heading}>Check your inbox</h1>
            <p style={{ ...sub, marginTop: "0.5rem" }}>
              If <strong style={{ color: "#F7F5F0" }}>{email}</strong> has an account,
              a reset link is on its way. Check your spam folder if you don't see it.
            </p>
            <p style={{ ...sub, marginTop: "1.25rem", fontSize: "0.8125rem" }}>
              Remembered it? <Link href="/auth/login" style={gold}>Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <Wordmark />

      <div style={card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={heading}>Reset your password</h1>
          <p style={sub}>Enter your email and we will send a reset link.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label htmlFor="email" style={lbl}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={inp}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e)  => (e.target.style.borderColor = "#3D3830")}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.8rem", color: "#F87171", display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#2A1818", borderRadius: "8px", border: "1px solid #6B2A2A", margin: 0 }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <button
            type="submit"
            id="reset-submit"
            disabled={loading}
            style={submitBtn}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#D4B05A"; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C"; }}
          >
            {loading
              ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
              : <>Send Reset Link <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#6B6560", marginTop: "1.25rem", marginBottom: 0 }}>
          Remembered it? <Link href="/auth/login" style={gold}>Sign in →</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Shared ──────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <div style={{ position: "absolute", top: "1.25rem", left: "1.75rem" }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <span style={{ fontFamily: "var(--font-inter), sans-serif", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.05em" }}>
          <span style={{ color: "#C9A84C" }}>P</span><span style={{ color: "#F7F5F0" }}>lexovia</span>
        </span>
      </Link>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh", height: "100vh", overflow: "hidden",
  background: "#1C1917",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  position: "relative", fontFamily: "var(--font-inter), sans-serif",
  padding: "0 1.25rem",
};
const card: React.CSSProperties = {
  width: "100%", maxWidth: "400px",
  background: "#252320", border: "1px solid #2D2A26",
  borderRadius: "16px", padding: "2rem",
};
const heading: React.CSSProperties = {
  fontWeight: 700, fontSize: "1.375rem", letterSpacing: "-0.03em",
  color: "#F7F5F0", margin: 0,
};
const sub: React.CSSProperties = {
  fontSize: "0.875rem", color: "#6B6560",
  margin: "0.375rem 0 0", lineHeight: 1.55,
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.8125rem", fontWeight: 500,
  color: "#A8A29E", marginBottom: "5px",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "#2A2724", border: "1px solid #3D3830",
  borderRadius: "9px", color: "#F7F5F0",
  fontSize: "0.9375rem", outline: "none",
  transition: "border-color 0.15s", boxSizing: "border-box",
};
const submitBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  width: "100%", padding: "13px 20px",
  background: "#C9A84C", color: "#1C1917",
  border: "none", borderRadius: "10px",
  fontFamily: "var(--font-inter), sans-serif",
  fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.01em",
  cursor: "pointer", transition: "background 0.15s",
};
const gold: React.CSSProperties = { color: "#C9A84C", textDecoration: "none", fontWeight: 600 };
