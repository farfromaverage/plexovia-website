"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Bell, Mail, Calendar, TrendingUp,
  Lock, CheckCircle,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface AlertPrefs {
  plan:                    string | null;
  bid_calendar_digest:     boolean;
  performance_digest:      boolean;
  email:                   string | null;
}

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({
  id, checked, onChange, disabled,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: "44px", height: "24px", borderRadius: "12px",
        background: disabled ? "#2D2A26" : checked ? "#C9A84C" : "#2D2A26",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        opacity: disabled ? 0.4 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "3px",
        left: checked && !disabled ? "23px" : "3px",
        width: "18px", height: "18px",
        background: "#F7F5F0", borderRadius: "50%",
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );
}

/* ─── Setting row ────────────────────────────────────────────── */
function SettingRow({
  icon, label, description, children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", padding: "1.25rem 0",
      borderBottom: "1px solid #2D2A26",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
        <span style={{ color: "#6B6560", marginTop: "2px", flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "#F7F5F0", margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#6B6560", margin: "3px 0 0", lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ─── Pro gate banner ────────────────────────────────────────── */
function ProGate() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "8px 12px", background: "#1A1812",
      border: "1px solid #3A3020", borderRadius: "8px",
    }}>
      <Lock size={13} color="#C9A84C" />
      <strong style={{ fontSize: "0.78125rem", color: "#8A7F74" }}>Requires Active Plan</strong>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AlertSettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<AlertPrefs>({
    plan: null, bid_calendar_digest: false,
    performance_digest: false, email: null,
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("plan, email, bid_calendar_digest, performance_digest")
        .eq("id", session.user.id)
        .single();

      if (!error && data) {
        setPrefs({
          plan:                 data.plan ?? null,
          email:                data.email ?? (session.user.email ?? null),
          bid_calendar_digest:  data.bid_calendar_digest  ?? false,
          performance_digest:   data.performance_digest   ?? false,
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        bid_calendar_digest: prefs.bid_calendar_digest,
        performance_digest:  prefs.performance_digest,
      })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      // Columns may not exist yet — show the SQL hint
      setError("Column missing. Run the SQL migration below in your Supabase dashboard, then try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    }
  }

  const hasPlan = prefs.plan === "pro" || prefs.plan === "premium" || prefs.plan === "active" || prefs.plan === "professional";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1C1917", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: "22px", height: "22px", border: "2px solid #2D2A26", borderTopColor: "#C9A84C", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#1C1917", fontFamily: "var(--font-inter), sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back header */}
      <div style={{ borderBottom: "1px solid #252320", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B6560", textDecoration: "none", fontSize: "0.875rem", transition: "color 0.15s" }}>
          <ArrowLeft size={15} /> Dashboard
        </Link>
        <span style={{ color: "#2D2A26" }}>/</span>
        <span style={{ fontSize: "0.875rem", color: "#A8A29E" }}>Alert Settings</span>
      </div>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>

        {/* Title */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <Bell size={20} color="#C9A84C" />
            <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#F7F5F0", margin: 0, letterSpacing: "-0.04em" }}>
              Alert Settings
            </h1>
          </div>
          <p style={{ fontSize: "0.9rem", color: "#6B6560", margin: 0, lineHeight: 1.55 }}>
            Control which email reports Plexovia sends to{" "}
            <strong style={{ color: "#A8A29E" }}>{prefs.email ?? "your email"}</strong>.
          </p>
        </div>

        {/* Section: Core delivery (always on) */}
        <div style={{ background: "#252320", border: "1px solid #2D2A26", borderRadius: "14px", padding: "0 1.5rem", marginBottom: "1.5rem" }}>

          <div style={{ padding: "1rem 0", borderBottom: "1px solid #2D2A26" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6560", margin: 0 }}>
              Core Delivery
            </p>
          </div>

          <SettingRow
            icon={<Mail size={16} />}
            label="Daily Contract Digest"
            description={
              hasPlan
                ? "Your matched contracts, ranked by AI score. Sent once per day at 6 AM EST."
                : "Your matched contracts, ranked by AI score. Sent once per day at 6 AM EST."
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78125rem", color: "#4ADE80", fontWeight: 600 }}>Active</span>
              <Toggle id="daily-digest" checked={true} onChange={() => {}} disabled={true} />
            </div>
          </SettingRow>

          <SettingRow
            icon={<Bell size={16} />}
            label="Deadline Reminders"
            description={
              hasPlan
                ? "Alerts at 3 days and 1 day before a bid closes."
                : "Alerts at 3 days and 1 day before a bid closes."
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78125rem", color: "#4ADE80", fontWeight: 600 }}>Active</span>
              <Toggle id="deadline-reminders" checked={true} onChange={() => {}} disabled={true} />
            </div>
          </SettingRow>

        </div>

        {/* Section: Weekly digests (Pro only) */}
        <div style={{ background: "#252320", border: "1px solid #2D2A26", borderRadius: "14px", padding: "0 1.5rem", marginBottom: "2rem" }}>

          <div style={{ padding: "1rem 0", borderBottom: "1px solid #2D2A26", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6560", margin: 0 }}>
              Weekly Digests
            </p>
            {!hasPlan && (
              <Link href="/pricing" style={{ fontSize: "0.75rem", color: "#C9A84C", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <Lock size={11} /> Upgrade Plan
              </Link>
            )}
          </div>

          <SettingRow
            icon={<Calendar size={16} />}
            label="Bid Calendar Weekly Digest"
            description="Every Sunday: a summary of all open bids in your NAICS codes with their closing dates. Plan your week before Monday."
          >
            {hasPlan ? (
              <Toggle
                id="bid-calendar-digest"
                checked={prefs.bid_calendar_digest}
                onChange={v => setPrefs(p => ({ ...p, bid_calendar_digest: v }))}
              />
            ) : (
              <ProGate />
            )}
          </SettingRow>

          <SettingRow
            icon={<TrendingUp size={16} />}
            label="Weekly Performance Digest"
            description="Every Monday: total matches last week, match rate trend, and your top keywords by match volume."
          >
            {hasPlan ? (
              <Toggle
                id="performance-digest"
                checked={prefs.performance_digest}
                onChange={v => setPrefs(p => ({ ...p, performance_digest: v }))}
              />
            ) : (
              <ProGate />
            )}
          </SettingRow>

        </div>

        {/* Save button */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={handleSave}
            disabled={saving || !hasPlan}
            style={{
              padding: "11px 28px", background: hasPlan ? "#C9A84C" : "#252320",
              color: hasPlan ? "#1C1917" : "#4A4540",
              border: `1px solid ${hasPlan ? "#C9A84C" : "#2D2A26"}`,
              borderRadius: "9px", fontWeight: 700, fontSize: "0.9375rem",
              cursor: hasPlan ? "pointer" : "not-allowed",
              fontFamily: "var(--font-inter), sans-serif",
              minWidth: "140px", transition: "opacity 0.15s",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {saved && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "#4ADE80" }}>
              <CheckCircle size={15} /> Saved
            </span>
          )}

          {!hasPlan && (
            <span style={{ fontSize: "0.8125rem", color: "#6B6560" }}>
              <Link href="/pricing" style={{ color: "#C9A84C", textDecoration: "none", fontWeight: 600 }}>Upgrade</Link>
              {" "}to enable weekly digests.
            </span>
          )}
        </div>

        {/* Error + SQL migration hint */}
        {error && (
          <div style={{ marginTop: "1.5rem", padding: "1.25rem 1.5rem", background: "#1A1215", border: "1px solid #3A2020", borderRadius: "10px" }}>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#FCA5A5", margin: "0 0 0.75rem" }}>
              One-time database setup required
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#8A7F74", margin: "0 0 1rem", lineHeight: 1.6 }}>
              Run this SQL once in your{" "}
              <a href="https://supabase.com/dashboard/project/bxbcmxiwquwmldkbmbyb/sql/new" target="_blank" rel="noopener noreferrer" style={{ color: "#C9A84C", textDecoration: "none" }}>
                Supabase SQL editor
              </a>
              , then click Save Changes again:
            </p>
            <pre style={{
              background: "#0F0D0B", border: "1px solid #2D2A26", borderRadius: "8px",
              padding: "1rem", fontSize: "0.78125rem", color: "#86EFAC",
              fontFamily: "var(--font-geist-mono, monospace)", overflowX: "auto",
              margin: 0,
            }}>{`ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bid_calendar_digest  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS performance_digest   boolean NOT NULL DEFAULT false;`}</pre>
          </div>
        )}

        {/* Info note */}
        <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", background: "#1A1812", border: "1px solid #2D2A26", borderRadius: "10px" }}>
          <p style={{ fontSize: "0.8125rem", color: "#6B6560", margin: 0, lineHeight: 1.6 }}>
            All emails are sent to the address on your account. To change it, contact{" "}
            <a href="mailto:support@plexovia.com" style={{ color: "#C9A84C", textDecoration: "none" }}>
              support@plexovia.com
            </a>.
            Unsubscribing from a digest does not affect your daily contract alerts.
          </p>
        </div>

      </main>
    </div>
  );
}
