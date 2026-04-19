"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bell, Mail, Calendar, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface AlertPrefs {
  bid_calendar_digest: boolean;
  performance_digest:  boolean;
  email:               string | null;
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
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: "44px", height: "24px", borderRadius: "12px",
        background: disabled ? "var(--app-border)" : checked ? "var(--accent)" : "var(--app-border)",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", transition: "background 0.2s",
        opacity: disabled ? 0.45 : 1, flexShrink: 0,
      }}
      aria-label={checked ? "Enabled" : "Disabled"}
    >
      <span style={{
        position: "absolute", top: "3px",
        left: checked && !disabled ? "23px" : "3px",
        width: "18px", height: "18px",
        background: "var(--app-text)", borderRadius: "50%",
        transition: "left 0.2s", display: "block",
      }} />
    </button>
  );
}

/* ─── Setting row ────────────────────────────────────────────── */
function SettingRow({
  icon, label, description, children,
}: {
  icon: React.ReactNode; label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem", padding: "1.125rem 0",
      borderBottom: "1px solid var(--app-border)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
        <span style={{ color: "var(--app-faint)", marginTop: "2px", flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)", margin: 0 }}>{label}</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "3px 0 0", lineHeight: 1.5 }}>{description}</p>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AlertSettingsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<AlertPrefs>({
    bid_calendar_digest: false, performance_digest: false, email: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      setUserId(session.user.id);

      const { data, error: dbErr } = await supabase
        .from("profiles")
        .select("email, bid_calendar_digest, performance_digest")
        .eq("id", session.user.id)
        .single();

      if (!dbErr && data) {
        setPrefs({
          email:               data.email ?? (session.user.email ?? null),
          bid_calendar_digest: data.bid_calendar_digest ?? false,
          performance_digest:  data.performance_digest  ?? false,
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true); setSaved(false); setError(null);
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({
        bid_calendar_digest: prefs.bid_calendar_digest,
        performance_digest:  prefs.performance_digest,
      })
      .eq("id", userId);
    setSaving(false);
    if (dbErr) {
      setError(dbErr.message || "Failed to save preferences.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    }
  }

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} aria-label="Loading…" role="status" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dash-main">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Page header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Bell size={20} color="var(--accent)" aria-hidden="true" />
            Notification Preferences
          </h1>
          <p className="dash-page-sub">
            Manage dashboard monitoring and optional email reports sent to{" "}
            <strong style={{ color: "var(--app-text)" }}>{prefs.email ?? "your account email"}</strong>.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>

        {/* Core delivery — always on */}
        <div className="dash-section" style={{ marginBottom: "1.25rem" }}>
          <p className="dash-label">Dashboard Monitoring: Always On</p>

          <SettingRow
            icon={<Mail size={15} aria-hidden="true" />}
            label="Contract Monitoring"
            description="Your dashboard updates daily with matched contracts, ranked by AI score. No action needed."
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78rem", color: "#4ADE80", fontWeight: 600 }}>Active</span>
              <Toggle id="daily-monitoring" checked={true} onChange={() => {}} disabled={true} />
            </div>
          </SettingRow>

          <SettingRow
            icon={<Bell size={15} aria-hidden="true" />}
            label="Deadline Reminders"
            description="Alerts at 3 days and 1 day before a tracked bid closes."
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78rem", color: "#4ADE80", fontWeight: 600 }}>Active</span>
              <Toggle id="deadline-reminders" checked={true} onChange={() => {}} disabled={true} />
            </div>
          </SettingRow>
        </div>

        {/* Optional email reports — user-configurable */}
        <div className="dash-section" style={{ marginBottom: "1.5rem" }}>
          <p className="dash-label">Optional Email Reports</p>

          <SettingRow
            icon={<Calendar size={15} aria-hidden="true" />}
            label="Weekly Bid Calendar"
            description="Every Sunday: open bids in your NAICS codes with closing dates. Plan your week before Monday."
          >
            <Toggle
              id="bid-calendar-digest"
              checked={prefs.bid_calendar_digest}
              onChange={v => setPrefs(p => ({ ...p, bid_calendar_digest: v }))}
            />
          </SettingRow>

          <SettingRow
            icon={<TrendingUp size={15} aria-hidden="true" />}
            label="Weekly Performance Summary"
            description="Every Monday: total matches last week, match rate trend, and your top keywords by volume."
          >
            <Toggle
              id="performance-digest"
              checked={prefs.performance_digest}
              onChange={v => setPrefs(p => ({ ...p, performance_digest: v }))}
            />
          </SettingRow>
        </div>

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="dash-btn dash-btn-primary"
            style={{ minWidth: 140, minHeight: 40, fontSize: "0.9375rem" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "#4ADE80" }}>
              <CheckCircle size={14} aria-hidden="true" /> Saved
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="dash-alert-error" role="alert" style={{ marginBottom: "1.5rem" }}>
            <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Info note */}
        <div style={{
          padding: "0.875rem 1.125rem",
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.8125rem",
          color: "var(--app-muted)",
          lineHeight: 1.6,
        }}>
          All emails go to the address on your account. To change it, contact{" "}
          <a href="mailto:support@plexovia.com" style={{ color: "var(--accent)", textDecoration: "none" }}>
            support@plexovia.com
          </a>.
          Toggling off an email report does not affect your dashboard monitoring. All matched contracts always appear in your dashboard.
        </div>

      </div>
    </div>
  );
}
