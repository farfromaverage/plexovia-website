"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

/* ─── Shared ──────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <div className="absolute top-6 left-7">
      <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
        <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
      </Link>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--app-border)]" />
      <span className="text-xs text-[var(--app-faint)] lowercase tracking-wide">or</span>
      <div className="flex-1 h-px bg-[var(--app-border)]" />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [terms, setTerms]     = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  function getPwStrength(p: string) {
    if (!p) return -1;
    let score = 0;
    if (p.length > 7) score += 1;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^a-zA-Z0-9]/.test(p)) score += 1;
    return score;
  }
  const pwScore = getPwStrength(pw);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    if (!terms) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }
    
    if (pw.length < 8) { 
      setError("Password must be at least 8 characters."); 
      return; 
    }
    
    setLoading(true);

    const { data, error: err } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (err) { 
      setError(err.message); 
      setLoading(false); 
      return; 
    }

    if (data.user) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      
      // Save TOS acceptance and trial details immediately so it isn't lost during the email confirmation loop
      await supabase.from("profiles").update({ 
          trial_ends_at: trialEndsAt.toISOString(),
          accepted_tos: true,
          tos_accepted_at: new Date().toISOString()
      }).eq("id", data.user.id);

      // Edge cases: If session is present immediately (e.g., email confirmation disabled), redirect.
      // Otherwise show success to prompt checking inbox.
      if (data.session) {
        router.push("/dashboard");
      } else {
        setSuccess(true);
      }
    }
    
    setLoading(false);
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)]">
        <Wordmark />
        <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-2xl">
          <div className="text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-bg-app)] border border-[var(--accent)]/30 flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle2 size={26} className="text-[var(--accent)]" />
            </div>
            <h1 className="font-bold text-2xl tracking-tight text-[var(--app-text)] mb-2">Check your inbox</h1>
            <p className="text-[var(--app-muted)] text-[15px] leading-relaxed">
              Confirmation link sent to <strong className="text-[var(--app-text)] font-semibold">{email}</strong>.<br />
              Click it to verify your account.
            </p>
            <p className="text-[14px] text-[var(--app-muted)] mt-6">
              Already confirmed? <Link href="/auth/login" className="text-[var(--accent)] font-semibold hover:text-[var(--accent-lt)] transition-colors">Sign in &rarr;</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)]">
      <Wordmark />

      <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="font-bold text-2xl xl:text-[26px] tracking-tight text-[var(--app-text)] mb-2">
            Create your account
          </h1>
        </div>

        {/* Google — primary CTA */}
        <GoogleButton />

        <Divider />

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">
              Email
            </label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              required 
              className="w-full px-4 py-3 bg-[var(--app-surface-2)]/50 border border-[var(--app-border)] rounded-xl text-[var(--app-text)] text-[15px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--app-faint)]"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--app-muted)] mb-1.5 pl-0.5">
              Password
            </label>
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
            
            {pwScore >= 0 && (
              <div className="mt-2 flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      pwScore > i 
                        ? (pwScore < 2 ? "bg-red-500" : pwScore < 4 ? "bg-amber-500" : "bg-green-500") 
                        : "bg-[var(--app-border)]"
                    }`}
                  />
                ))}
              </div>
            )}
            {pwScore >= 0 && (
              <p className={`text-[11px] font-medium mt-1.5 ${
                pwScore < 2 ? "text-red-500" : pwScore < 4 ? "text-amber-500" : "text-green-500"
              }`}>
                {pwScore < 2 ? "Weak" : pwScore < 4 ? "Fair" : "Strong password"}
              </p>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start gap-3 mt-1 mb-1">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                required
                aria-required="true"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 rounded appearance-none border border-[var(--app-faint)] bg-[var(--app-surface-2)] checked:bg-[var(--accent)] checked:border-[var(--accent)] relative cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)] after:content-[''] after:absolute after:top-[2px] after:left-[5px] after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-white after:rotate-45 after:hidden checked:after:block"
              />
            </div>
            <label htmlFor="terms" className="text-sm text-[var(--app-muted)] leading-tight cursor-pointer">
              I agree to the{" "}
              <Link href="/legal/terms" className="text-[var(--app-text)] hover:text-[var(--accent)] underline decoration-[var(--app-border)] underline-offset-2 transition-colors">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/legal/privacy" className="text-[var(--app-text)] hover:text-[var(--accent)] underline decoration-[var(--app-border)] underline-offset-2 transition-colors">
                Privacy Policy
              </Link>.
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            id="email-signup" 
            disabled={loading} 
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 mt-2 bg-[var(--accent)] text-[#1C1917] font-bold text-[15px] rounded-xl transition-colors hover:bg-[var(--accent-lt)] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={17} strokeWidth={2.5} /></>}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-[14px] font-medium text-[var(--app-muted)] mt-6">
          Already have an account? <Link href="/auth/login" className="text-[var(--accent)] hover:text-[var(--accent-lt)] transition-colors">Sign in &rarr;</Link>
        </p>
        <p className="text-center text-[13px] text-[var(--app-faint)] mt-3">
          Need help? <a href="mailto:support@plexovia.com" className="hover:text-[var(--app-muted)] transition-colors">support@plexovia.com</a>
        </p>
      </div>
    </div>
  );
}
