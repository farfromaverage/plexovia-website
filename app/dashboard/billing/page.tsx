"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ExternalLink, CreditCard, Calendar, Zap, AlertCircle, RefreshCw, LayoutList, ArrowRight } from "lucide-react";
import { engineFetch } from "@/lib/engine";

const PLAN_DETAILS = {
  trial: {
    name: "Trial",
    price: "Free",
    color: "var(--accent)",
    features: ["All federal sources", "Unlimited NAICS codes", "Twice-daily contract monitoring", "Match explanations", "30-day rolling window"],
  },
  active: {
    name: "Plexovia Intelligence",
    price: "$249/mo",
    color: "var(--success)",
    features: ["All federal sources", "Unlimited NAICS codes", "Twice-daily contract monitoring", "Match explanations", "30-day rolling window"],
  },
  cancelled: {
    name: "Cancelled",
    price: "N/A",
    color: "var(--danger)",
    features: [],
  },
} as const;

interface Profile {
  id: string; plan: string | null; plan_expires_at: string | null;
  trial_ends_at: string | null; ls_customer_id: string | null;
  email: string | null;
  calendar_token: string | null;
  deadline_reminders_enabled: boolean | null;
}

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipelineSummary, setPipelineSummary] = useState<{
    total_tracked: number;
    active_pursuits: number;
    notes_count: number;
    calendar_active: boolean;
    deadline_reminders_active: boolean;
  } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data, error: dbErr } = await supabase
        .from("profiles")
        .select("id,plan,plan_expires_at,trial_ends_at,ls_customer_id,email,calendar_token,deadline_reminders_enabled")
        .eq("id", user.id)
        .single();
      if (dbErr) throw new Error(dbErr.message);
      if (data) {
        setProfile(data);
        setError(null);
        try {
          const pipeResp = await engineFetch("/api/user/pipeline");
          if (pipeResp.ok) {
            const pipeJson = await pipeResp.json();
            const stages = pipeJson.stages || [];
            let notesCount = 0;
            for (const col of stages) {
              for (const item of col.items || []) {
                if (item.pipeline_notes) notesCount += 1;
              }
            }
            setPipelineSummary({
              total_tracked: pipeJson.scorecard?.total_tracked ?? 0,
              active_pursuits: pipeJson.scorecard?.active_pursuits ?? 0,
              notes_count: notesCount,
              calendar_active: !!data.calendar_token,
              deadline_reminders_active: data.deadline_reminders_enabled ?? true,
            });
          }
        } catch { /* pipeline API unavailable — silently omit the card */ }
      } else {
        setError("Profile not found. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load billing information.");
    }
  }, [router]);

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      await loadProfile();
      setLoading(false);
    }
    initialLoad();
  }, [loadProfile]);

  useEffect(() => {
    const interval = setInterval(loadProfile, 60_000);
    return () => clearInterval(interval);
  }, [loadProfile]);

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
    <div className="dash-main">
      <div style={s.wrap}>
        <div className="dash-skeleton" style={{ width: 180, height: 28, marginBottom: 8, borderRadius: 4 }} />
        <div className="dash-skeleton" style={{ width: 280, height: 16, marginBottom: "2rem", borderRadius: 4 }} />
        <div style={s.card}>
          <div className="dash-skeleton" style={{ width: 100, height: 12, marginBottom: 12, borderRadius: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div className="dash-skeleton" style={{ width: 160, height: 28, marginBottom: 10, borderRadius: 999 }} />
              <div className="dash-skeleton" style={{ width: 90, height: 20, marginBottom: 10, borderRadius: 4 }} />
              <div className="dash-skeleton" style={{ width: 200, height: 14, borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="dash-skeleton" style={{ width: 140, height: 38, borderRadius: 6 }} />
              <div className="dash-skeleton" style={{ width: 210, height: 38, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="dash-main">
      <div style={s.wrap}>
        <h1 style={s.h1}>Billing & Plan</h1>
        <p style={s.sub}>Manage your subscription and payment information.</p>
        <div style={{ ...s.card, textAlign: "center", padding: "3rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--danger-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertCircle size={22} style={{ color: "var(--danger)" }} aria-hidden="true" />
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-text-secondary)", margin: 0, lineHeight: 1.35 }}>
            Unable to load billing information
          </p>
          <p style={{ color: "var(--app-muted)", fontSize: "0.8125rem", margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={() => { setError(null); setLoading(true); loadProfile().then(() => setLoading(false)); }}
            className="dash-btn"
            style={{ marginTop: "var(--space-1)", minHeight: 36 }}
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </div>
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
                  <span style={{ background: "var(--success-subtle)", border: "1px solid rgba(26,119,66,0.2)", borderRadius: "999px", padding: "3px 10px", fontSize: "0.78rem", color: "var(--success)" }}>
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
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", fontSize: "0.85rem" }}>
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
                  style={{ ...s.actionBtn, background: "var(--accent)", color: "#fff" }}
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

        {/* Pipeline Loss Summary Card */}
        {pipelineSummary && (
          <div style={{ ...s.card, border: "1px solid var(--accent-border)", background: "var(--accent-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <LayoutList size={16} color="var(--accent)" aria-hidden="true" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--app-text)" }}>
                {plan === "trial" ? "Your Trial Pipeline" : "Your Pipeline"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "var(--space-3)", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Tracked</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--app-text)" }}>{pipelineSummary.total_tracked}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>In Active Pursuit</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: pipelineSummary.active_pursuits > 0 ? "var(--accent)" : "var(--app-muted)" }}>{pipelineSummary.active_pursuits}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>With Research Notes</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: pipelineSummary.notes_count > 0 ? "var(--app-text)" : "var(--app-muted)" }}>
                  {pipelineSummary.notes_count}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Deadline Reminders</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: pipelineSummary.deadline_reminders_active ? "var(--success)" : "var(--app-muted)" }}>
                  {pipelineSummary.deadline_reminders_active ? "Active" : "Off"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Calendar Sync</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: pipelineSummary.calendar_active ? "var(--success)" : "var(--app-muted)" }}>
                  {pipelineSummary.calendar_active ? "Active" : "Not set"}
                </div>
              </div>
            </div>

            {plan === "trial" ? (
              <div style={{ fontSize: "0.82rem", color: "var(--app-muted)", lineHeight: 1.5 }}>
                You&apos;ve built this pipeline during your {trialDaysLeft}-day trial.{" "}
                <strong style={{ color: "var(--app-text)" }}>Subscribe to keep full access</strong> to your tracked opportunities, research notes, and deadline calendar.
              </div>
            ) : plan === "cancelled" ? (
              <div style={{ fontSize: "0.82rem", color: "var(--danger)", lineHeight: 1.5, display: "flex", alignItems: "center", gap: 6 }}>
                Your pipeline data is preserved for 90 days after cancellation. Reactivate to regain access.
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <Link
                  href="/dashboard/pipeline"
                  style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                >
                  Manage pipeline <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
