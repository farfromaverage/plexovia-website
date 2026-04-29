"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

/* ─── Inner form ─────────────────────────────────────────────────── */
function ResetForm() {
  const router  = useRouter();
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    
    // As a fallback (if event was already fired before effect ran), check if session exists.
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
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
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1E2A1E] border border-[#2D5A2D] flex items-center justify-center mb-5 shadow-inner">
            <CheckCircle2 size={24} className="text-[#4ADE80]" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-[var(--app-text)] mb-2">Password updated</h1>
          <p className="text-[var(--app-muted)] text-[15px] leading-relaxed mt-2">
            Redirecting you to dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* ── Waiting for token ── */
  if (!ready) {
    return (
      <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl relative z-10">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[var(--accent)] mx-auto mb-4" />
          <p className="text-[var(--app-muted)] text-[15px]">Verifying your reset link...</p>
          <p className="text-[14px] text-[var(--app-muted)] mt-4">
            Link expired? <Link href="/auth/forgot-password" className="text-[var(--accent)] hover:text-[var(--accent-lt)] transition-colors">Request a new one &rarr;</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl relative z-10">
      {/* Header */}
      <div className="text-center mb-7">
        <h1 className="font-bold text-2xl xl:text-[26px] tracking-tight text-[var(--app-text)] mb-2">Set new password</h1>
        <p className="text-[var(--app-muted)] text-[15px]">Must be at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* New password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">New password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="8+ characters"
              required
              className="w-full px-4 py-3 pr-12 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[15px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
            />
            <button 
              type="button" 
              onClick={() => setShowPw(!showPw)} 
              tabIndex={-1}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--app-faint)] hover:text-[var(--app-muted)] transition-colors"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            required
            className="w-full px-4 py-3 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[15px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mt-1">
            <AlertCircle size={15} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          id="update-password"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-5 py-3.5 mt-2 bg-[var(--accent)] text-[#1C1917] font-bold text-[15px] rounded-xl transition-colors hover:bg-[var(--accent-lt)] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <>Update Password <ArrowRight size={17} strokeWidth={2.5} /></>
          }
        </button>
      </form>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative overflow-hidden">
      <Wordmark />
      <Suspense fallback={
        <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl text-center text-[var(--app-muted)]">
          <Loader2 size={24} className="animate-spin mx-auto text-[var(--accent)]" />
        </div>
      }>
        <ResetForm />
      </Suspense>
    </div>
  );
}

/* ─── Shared ──────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <div className="absolute top-6 left-7 z-20">
      <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
        <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
      </Link>
    </div>
  );
}
