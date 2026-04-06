"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
        id="google-login"
        onClick={handleGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 bg-[#FFFFFF] border border-[#E2DDD6] rounded-xl text-[#1C1917] font-semibold text-[15px] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-[#1C1917]" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      {err && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
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

/* ─── Inner content (uses useSearchParams — must be wrapped) ─────── */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (params.get("error") === "confirmation_failed") {
      setError("Email confirmation failed. Try signing in or contact support.");
    }
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Email or password is incorrect." : err.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl relative z-10">
      {/* Header */}
      <div className="text-center mb-7">
        <h1 className="font-bold text-2xl xl:text-[26px] tracking-tight text-[var(--app-text)] mb-2">Welcome back</h1>
        <p className="text-[var(--app-muted)] text-[15px]">Sign in to your Plexovia account</p>
      </div>

      {/* Google — primary CTA */}
      <GoogleButton />

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--app-border)]" />
        <span className="text-xs text-[var(--app-faint)] lowercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-[var(--app-border)]" />
      </div>

      {/* Email / password */}
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

        <div>
          <div className="flex justify-between items-center mb-1.5 pl-0.5 pr-0.5">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--app-muted)]">Password</label>
            <Link href="/auth/forgot-password" tabIndex={-1} className="text-[13px] text-[var(--app-faint)] hover:text-[var(--accent)] transition-colors underline decoration-transparent hover:decoration-[var(--accent)] underline-offset-2">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input 
              id="password" 
              type={showPw ? "text" : "password"} 
              value={pw}
              onChange={(e) => setPw(e.target.value)} 
              placeholder="Your password"
              required 
              autoComplete="current-password"
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

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mt-1">
            <AlertCircle size={15} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button 
          type="submit" 
          id="email-login" 
          disabled={loading} 
          className="flex items-center justify-center gap-2 w-full px-5 py-3.5 mt-2 bg-[var(--accent)] text-[#1C1917] font-bold text-[15px] rounded-xl transition-colors hover:bg-[var(--accent-lt)] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={17} strokeWidth={2.5} /></>}
        </button>
      </form>

      <p className="text-center text-[14px] font-medium text-[var(--app-muted)] mt-6">
        No account? <Link href="/auth/signup" className="text-[var(--accent)] hover:text-[var(--accent-lt)] transition-colors">Create account &rarr;</Link>
      </p>
      <p className="text-center text-[13px] text-[var(--app-faint)] mt-3">
        Need help? <a href="mailto:support@plexovia.com" className="hover:text-[var(--app-muted)] transition-colors">support@plexovia.com</a>
      </p>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative overflow-hidden">
      <Wordmark />
      <Suspense fallback={<div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl text-center text-[var(--app-muted)]"><Loader2 size={24} className="animate-spin mx-auto text-[var(--accent)]" /></div>}>
        <LoginForm />
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
