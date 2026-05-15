"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2, AlertCircle, Mail, Shield, BarChart3, Zap } from "lucide-react";

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
      <div className="flex min-h-screen" style={{ animationName: "auth-fade-in", animationDuration: "400ms", animationTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)", animationFillMode: "both" }}>
        <BrandPanel />
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[var(--app-bg)] relative">
          <MobileWordmark />
          <div className="w-full max-w-[420px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/8 border border-[var(--accent)]/25 flex items-center justify-center mx-auto mb-6" style={{ animationName: "auth-check-pop", animationDuration: "500ms", animationTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)", animationFillMode: "both", animationDelay: "200ms" }}>
              <Mail size={26} className="text-[var(--accent)]" />
            </div>
            <h1 className="font-bold text-[28px] tracking-tight text-[var(--app-text)] mb-3">Check your email</h1>
            <p className="text-[var(--app-muted)] text-[15px] leading-relaxed mt-2">
              If an account exists for <strong className="text-[var(--app-text)] font-semibold">{email}</strong>,
              a reset link is on its way. Check spam if you don&apos;t see it within 2 minutes.
            </p>
            <p className="text-[14px] text-[var(--app-muted)] mt-8">
              Remember your password? <Link href="/auth/login" className="text-[var(--accent)] font-semibold hover:text-[var(--accent-hover)] transition-colors">Sign in &rarr;</Link>
            </p>
          </div>
        </div>
        <style>{`
          @keyframes auth-fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes auth-check-pop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ animationName: "auth-fade-in", animationDuration: "400ms", animationTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)", animationFillMode: "both" }}>
      <BrandPanel />

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[var(--app-bg)] relative">
        <MobileWordmark />

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-bold text-[28px] tracking-tight text-[var(--app-text)] mb-2">Reset your password</h1>
            <p className="text-[var(--app-muted)] text-[15px]">Enter your email below. We&apos;ll send a reset link.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                className="w-full px-4 py-3 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[15px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 placeholder-[var(--app-faint)]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-[var(--danger)]/8 border border-[var(--danger)]/20 rounded-lg text-[var(--danger)] text-sm">
                <AlertCircle size={15} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              id="reset-submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full px-5 py-3.5 mt-1 bg-[var(--accent)] text-white font-bold text-[15px] rounded-xl transition-all hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/20 disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <>Send Reset Link <ArrowRight size={17} strokeWidth={2.5} /></>
              }
            </button>
          </form>

          <p className="text-center text-[14px] font-medium text-[var(--app-muted)] mt-8">
            Remember your password? <Link href="/auth/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">Sign in &rarr;</Link>
          </p>
          <p className="text-center text-[13px] text-[var(--app-faint)] mt-3">
            Need help? <a href="mailto:support@plexovia.com" className="hover:text-[var(--app-muted)] transition-colors">support@plexovia.com</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes auth-fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ─── Shared Components ───────────────────────────────────────────── */
function MobileWordmark() {
  return (
    <div className="lg:hidden absolute top-6 left-7 z-20">
      <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
        <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
      </Link>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[480px] min-h-screen p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #635BFF 0%, #4B44D6 40%, #3B35B0 100%)" }}
    >
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1zM0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="absolute top-20 right-10 w-64 h-64 bg-white/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-32 left-10 w-48 h-48 bg-white/[0.04] rounded-full blur-3xl" />

      <div className="relative z-10">
        <Link href="/" className="font-bold text-2xl tracking-tight text-white/90 hover:text-white transition-colors">Plexovia</Link>
      </div>
      <div className="relative z-10 -mt-8">
        <h2 className="text-white text-[32px] font-bold leading-tight tracking-tight mb-6">
          Every federal contract<br/>that fits your business.<br/>Scored. Ranked.<br/>Ready in your dashboard.
        </h2>
        <div className="flex flex-col gap-4 mt-8">
          {[
            { icon: Shield, label: "SAM.gov contract opportunities reviewed daily" },
            { icon: BarChart3, label: "Every match scored 0–100 by relevance to your profile" },
            { icon: Zap, label: "7-day free trial. No charge until Day 8." },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-white/80" />
              </div>
              <span className="text-white/70 text-[14px] leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-white/40 text-[13px]">Built for government contractors who win federal work</p>
      </div>
    </div>
  );
}
