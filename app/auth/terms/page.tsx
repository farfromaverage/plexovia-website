"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!terms) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error: err } = await supabase.from("profiles").update({ 
        accepted_tos: true,
        tos_accepted_at: new Date().toISOString()
      }).eq("id", user.id);

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard/onboarding");
    } else {
      router.push("/auth/login");
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-5 selection:bg-[var(--accent)] selection:text-[var(--pub-text)] relative overflow-hidden">
      <div className="absolute top-6 left-7 z-20">
        <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-[var(--accent)]">P</span><span className="text-[var(--app-text)]">lexovia</span>
        </Link>
      </div>

      <div className="w-full max-w-[420px] bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-8 shadow-xl relative z-10">
        <div className="text-center mb-7">
          <h1 className="font-bold text-2xl xl:text-[26px] tracking-tight text-[var(--app-text)] mb-2">Terms of Service</h1>
          <p className="text-[var(--app-muted)] text-[15px]">Please review and accept our terms to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-4 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-xl text-sm text-[var(--app-muted)] h-40 overflow-y-auto mb-2 text-justify">
            <p className="mb-2"><strong>Welcome to Plexovia.</strong> By proceeding, you agree to our Terms of Service and Privacy Policy. Plexovia monitors public government contract portals and provides analytics.</p>
            <p className="mb-2">1. <strong>Use of Service:</strong> Your account is for your internal business use only. You may not resell or scrape our data.</p>
            <p className="mb-2">2. <strong>Billing:</strong> If you proceed past the 7-day free trial, your payment method will be charged automatically on a recurring basis. You may cancel at any time via the billing portal.</p>
            <p>Please review our full agreements via the links below.</p>
          </div>

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
              I have read and agree to the{" "}
              <Link href="/legal/terms" target="_blank" className="text-[var(--app-text)] hover:text-[var(--accent)] underline decoration-[var(--app-border)] underline-offset-2 transition-colors">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/legal/privacy" target="_blank" className="text-[var(--app-text)] hover:text-[var(--accent)] underline decoration-[var(--app-border)] underline-offset-2 transition-colors">
                Privacy Policy
              </Link>.
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mt-1">
              <AlertCircle size={15} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 mt-2 bg-[var(--accent)] text-[#1C1917] font-bold text-[15px] rounded-xl transition-colors hover:bg-[var(--accent-lt)] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Accept & Continue <ArrowRight size={17} strokeWidth={2.5} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
