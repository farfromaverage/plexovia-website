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
      <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative overflow-hidden">
        <Wordmark />
        <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1E2A1E] border border-[#2D5A2D] flex items-center justify-center mb-5 shadow-inner">
              <Mail size={24} className="text-[#4ADE80]" />
            </div>
            <h1 className="font-bold text-2xl tracking-tight text-[var(--app-text)] mb-2">Check your inbox</h1>
            <p className="text-[var(--app-muted)] text-[15px] leading-relaxed mt-2">
              If <strong className="text-[var(--app-text)] font-semibold">{email}</strong> has an account,
              a reset link is on its way. Check your spam folder if you don't see it.
            </p>
            <p className="text-[14px] text-[var(--app-muted)] mt-6">
              Remembered it? <Link href="/auth/login" className="text-[var(--accent)] font-semibold hover:text-[var(--accent-lt)] transition-colors">Sign in &rarr;</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative overflow-hidden">
      <Wordmark />

      <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="font-bold text-2xl xl:text-[26px] tracking-tight text-[var(--app-text)] mb-2">Reset your password</h1>
          <p className="text-[var(--app-muted)] text-[15px]">Enter your email and we will send a reset link.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[15px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mt-1">
              <AlertCircle size={15} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            id="reset-submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 mt-2 bg-[var(--accent)] text-[#1C1917] font-bold text-[15px] rounded-xl transition-colors hover:bg-[var(--accent-lt)] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <>Send Reset Link <ArrowRight size={17} strokeWidth={2.5} /></>
            }
          </button>
        </form>

        <p className="text-center text-[14px] font-medium text-[var(--app-muted)] mt-6">
          Remembered it? <Link href="/auth/login" className="text-[var(--accent)] hover:text-[var(--accent-lt)] transition-colors">Sign in &rarr;</Link>
        </p>
        <p className="text-center text-[13px] text-[var(--app-faint)] mt-3">
          Need help? <a href="mailto:support@plexovia.com" className="hover:text-[var(--app-muted)] transition-colors">support@plexovia.com</a>
        </p>
      </div>
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
