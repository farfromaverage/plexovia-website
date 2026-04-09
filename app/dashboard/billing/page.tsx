"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ExternalLink, CreditCard, Calendar, Zap, AlertCircle } from "lucide-react";
import Link from "next/link";

const PLAN_DETAILS = {
  trial: {
    name: "Trial",
    price: "Free",
    color: "#C9A84C",
    features: ["All 50 states", "Unlimited NAICS codes", "Daily email digest", "Competitor tracking", "Match explanations", "90-day history"],
  },
  active: {
    name: "Plexovia Intelligence",
    price: "$249/mo",
    color: "#4ADE80",
    features: ["All 50 states", "Unlimited NAICS codes", "Daily email digest", "Competitor tracking", "Match explanations", "90-day history"],
  },
  cancelled: {
    name: "Cancelled",
    price: "N/A",
    color: "#F87171",
    features: [],
  },
} as const;

interface Profile {
  id: string; plan: string | null; plan_expires_at: string | null;
  trial_ends_at: string | null; ls_customer_id: string | null;
  email: string | null;
}

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("id,plan,plan_expires_at,trial_ends_at,ls_customer_id,email")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  // Remap legacy 'pro' and 'premium' to 'active'
  const rawPlan = profile?.plan ?? "trial";
  const mappedPlan = (rawPlan === "pro" || rawPlan === "premium" || rawPlan === "professional") ? "active" : rawPlan;
  const plan = mappedPlan as keyof typeof PLAN_DETAILS;
  const details = PLAN_DETAILS[plan] ?? PLAN_DETAILS.trial;

  const isTrialing = profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  const trialDaysLeft = isTrialing
    ? Math.max(0, Math.ceil((new Date(profile!.trial_ends_at!).getTime() - Date.now()) / 86400000))
    : 0;

  const s = {
    wrap:    { maxWidth: 720 } as React.CSSProperties,
    h1:      { fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem", letterSpacing: "-0.03em" } as React.CSSProperties,
    sub:     { color: "var(--app-muted)", fontSize: "0.9rem", marginBottom: "2rem" } as React.CSSProperties,
    card:    { background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: "var(--radius-md)", padding: "1.5rem", marginBottom: "1.25rem" } as React.CSSProperties,
    planBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: "999px", padding: "4px 12px", fontSize: "0.82rem", fontWeight: 600, color: details.color } as React.CSSProperties,
    actionBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "0.65rem 1.25rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" } as React.CSSProperties,
  };

  if (loading) return (
    <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--app-muted)" }}>Loading billing…</span>
    </div>
  );

  return (
    <div className="dash-main">
      <div style={s.wrap}>
        <h1 style={s.h1}>Billing & Plan</h1>
        <p style={s.sub}>Manage your subscription and payment information.</p>

        {/* Current Plan Card */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Current Plan</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={s.planBadge}><Zap size={12} /> {details.name}</span>
                {isTrialing && (
                  <span style={{ background: "#1E2A1E", border: "1px solid #2D5A2D", borderRadius: "999px", padding: "3px 10px", fontSize: "0.78rem", color: "#4ADE80" }}>
                    Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
                  </span>
                )}
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>{details.price}</div>
              {profile?.plan_expires_at && (
                <div style={{ fontSize: "0.82rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={12} />
                  {plan === "cancelled" ? "Access until " : "Renews "}
                  {new Date(profile.plan_expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              )}
              {plan === "cancelled" && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "#F87171", fontSize: "0.85rem" }}>
                  <AlertCircle size={14} /> Your subscription has been cancelled.
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Manage Billing via LemonSqueezy customer portal */}
              {profile?.ls_customer_id && (
                <a
                  href={`https://app.lemonsqueezy.com/my-orders`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.actionBtn, background: "var(--app-surface-2)", color: "var(--app-text)", border: "1px solid var(--app-border)" }}
                >
                  <CreditCard size={14} /> Manage Billing <ExternalLink size={12} />
                </a>
              )}
              {/* Upgrade CTA for Trial or Cancelled users */}
              {(plan === "trial" || plan === "cancelled") && (
                <a
                  href="https://plexovia.lemonsqueezy.com/checkout/buy/pro-monthly"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.actionBtn, background: "#1C1917", color: "#fff" }}
                >
                  <Zap size={14} /> Subscribe to Plexovia Intelligence
                </a>
              )}
            </div>
          </div>

          {/* Features list */}
          {details.features.length > 0 && (
            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--app-border)" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--app-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Plan Includes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {details.features.map(f => (
                  <span key={f} style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: "999px", padding: "3px 10px", fontSize: "0.8rem", color: "var(--app-muted)" }}>
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agency / Enterprise card */}
        <div style={{ ...s.card, textAlign: "center" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Need Agency or Enterprise access?</div>
          <p style={{ color: "var(--app-muted)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
            The Plexovia Intelligence system remains the same. You can purchase multiple subscriptions to scale your team.
          </p>
          <a
            href="mailto:support@plexovia.com?subject=Enterprise Inquiry"
            style={{ ...s.actionBtn, background: "var(--app-surface-2)", color: "var(--app-text)", border: "1px solid var(--app-border)" }}
          >
            Contact us: support@plexovia.com
          </a>
        </div>
      </div>
    </div>
  );
}
