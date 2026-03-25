"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

/* ─── Inner form (uses useSearchParams) ──────────────────────────── */
function ResetForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [pw,       setPw]       = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [ready,    setReady]    = useState(false);

  /* Supabase sends the token in the URL hash — wait for the client to
     exchange it for a session before allowing form submission */
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pw !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 2500);
  }

  /* ── Success ── */
  if (success) {
    return (
      <div style={card}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1E2A1E", border: "1px solid #2D5A2D", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <CheckCircle2 size={22} color="#4ADE80" />
          </div>
          <h1 style={heading}>Password updated</h1>
          <p style={{ ...sub, marginTop: "0.5rem" }}>Redirecting you to sign in...</p>
        </div>
      </div>
    );
  }

  /* ── Waiting for token ── */
  if (!ready) {
    return (
      <div style={card}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={28} style={{ animation: "spin 0.8s linear infinite", color: "#C9A84C", margin: "0 auto 1rem" }} />
          <p style={sub}>Verifying your reset link...</p>
          <p style={{ ...sub, marginTop: "0.75rem", fontSize: "0.8rem" }}>
            Link expired? <Link href="/auth/forgot-password" style={gold}>Request a new one →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h1 style={heading}>Set new password</h1>
        <p style={sub}>Must be at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {/* New password */}
        <div>
          <label htmlFor="password" style={lbl}>New password</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="8+ characters"
              required
              style={{ ...inp, paddingRight: "44px" }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e)  => (e.target.style.borderColor = "#3D3830")}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
              style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B6560", padding: 0 }}
              aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm" style={lbl}>Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            required
            style={inp}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e)  => (e.target.style.borderColor = "#3D3830")}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: "0.8rem", color: "#F87171", display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#2A1818", borderRadius: "8px", border: "1px solid #6B2A2A", margin: 0 }}>
            <AlertCircle size={13} /> {error}
          </p>
        )}

        <button
          type="submit"
          id="update-password"
          disabled={loading}
          style={submitBtn}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#D4B05A"; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C"; }}
        >
          {loading
            ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
            : <>Update Password <ArrowRight size={15} /></>
          }
        </button>
      </form>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ResetPasswordPage() {
  return (
    <div style={page}>
      <Wordmark />
      <Suspense fallback={
        <div style={card}>
          <p style={{ ...sub, textAlign: "center" }}>Loading...</p>
        </div>
      }>
        <ResetForm />
      </Suspense>
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
