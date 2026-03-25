"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

/* ─── Google button ───────────────────────────────────────────────── */
function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  async function handleGoogle() {
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { setErr(error.message); setLoading(false); }
  }

  return (
    <div>
      <button
        type="button"
        id="google-signup"
        onClick={handleGoogle}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          width: "100%", padding: "13px 20px",
          background: "#fff", border: "1px solid #E5E0D8", borderRadius: "10px",
          color: "#1C1917", fontSize: "0.9375rem", fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.75 : 1,
          transition: "box-shadow 0.15s, opacity 0.15s",
          fontFamily: "var(--font-inter), sans-serif",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      {err && (
        <p style={{ fontSize: "0.8rem", color: "#F87171", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertCircle size={13} /> {err}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.017 17.64 11.71 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);

    const { data, error: err } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (err) { setError(err.message); setLoading(false); return; }

    if (data.user) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      await supabase.from("profiles").update({ trial_ends_at: trialEndsAt.toISOString() }).eq("id", data.user.id);
      data.session ? router.push("/dashboard") : setSuccess(true);
    }
    setLoading(false);
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div style={page}>
        <Wordmark />
        <div style={card}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#C9A84C18", border: "1px solid #C9A84C30", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h1 style={heading}>Check your inbox</h1>
            <p style={sub}>Confirmation link sent to <strong style={{ color: "#F7F5F0" }}>{email}</strong>.<br />Click it to activate your 7-day trial.</p>
            <p style={{ ...sub, marginTop: "1rem", fontSize: "0.8125rem" }}>
              Already confirmed? <Link href="/auth/login" style={gold}>Sign in →</Link>
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
          <h1 style={heading}>Start your 7-Day Free Trial</h1>
          <p style={sub}>No charge until Day 8. Cancel anytime.</p>
        </div>

        {/* Google — primary CTA */}
        <GoogleButton />

        {/* Divider */}
        <Divider />

        {/* Email / password form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Email */}
          <div>
            <label htmlFor="email" style={lbl}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required style={inp}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e)  => (e.target.style.borderColor = "#3D3830")}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" style={lbl}>Password</label>
            <div style={{ position: "relative" }}>
              <input id="password" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="8+ characters" required style={{ ...inp, paddingRight: "44px" }}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e)  => (e.target.style.borderColor = "#3D3830")}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B6560", padding: 0 }}
                aria-label={showPw ? "Hide" : "Show"}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: "0.8rem", color: "#F87171", display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: "#2A1818", borderRadius: "8px", border: "1px solid #6B2A2A", margin: 0 }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <button type="submit" id="email-signup" disabled={loading} style={submitBtn}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#D4B05A"; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#C9A84C"; }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <>Start Free Trial <ArrowRight size={15} /></>}
          </button>
        </form>

        {/* Footer link */}
        <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "#6B6560", marginTop: "1.25rem", marginBottom: 0 }}>
          Already have an account? <Link href="/auth/login" style={gold}>Sign in →</Link>
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

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.875rem 0" }}>
      <div style={{ flex: 1, height: "1px", background: "#2D2A26" }} />
      <span style={{ fontSize: "0.75rem", color: "#6B6560" }}>or</span>
      <div style={{ flex: 1, height: "1px", background: "#2D2A26" }} />
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh", height: "100vh", overflow: "hidden",
  background: "#1C1917",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  position: "relative",
  fontFamily: "var(--font-inter), sans-serif",
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
