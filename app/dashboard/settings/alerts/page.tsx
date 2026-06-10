"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Bell, Mail } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface AlertPrefs {
  email: string | null;
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
    email: null,
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      const { data, error: dbErr } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", session.user.id)
        .single();

      if (dbErr) {
        console.error("[alerts] Profile load failed:", dbErr.message);
        setError("Could not load your alert preferences. Showing defaults.");
        setPrefs({ email: session.user.email ?? null });
      } else if (data) {
        setPrefs({
          email:               data.email ?? (session.user.email ?? null),
        });
      } else {
        setPrefs({ email: session.user.email ?? null });
      }
      setLoading(false);
    }
    load();
  }, [router]);


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

      {error && (
        <div style={{ padding: "10px 14px", marginBottom: "1rem", background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: 8, color: "var(--app-muted)", fontSize: "0.8125rem" }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth: 680 }}>

        {/* Core delivery — always on */}
        <div className="dash-section" style={{ marginBottom: "1.25rem" }}>
          <p className="dash-label">Dashboard Monitoring: Always On</p>

          <SettingRow
            icon={<Mail size={15} aria-hidden="true" />}
            label="Contract Monitoring"
            description="Your dashboard updates twice daily with matched contracts, ranked by AI score. No action needed."
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 600 }}>Active</span>
              <Toggle id="daily-monitoring" checked={true} onChange={() => {}} disabled={true} />
            </div>
          </SettingRow>

          <SettingRow
            icon={<Bell size={15} aria-hidden="true" />}
            label="Deadline Reminders"
            description="Alerts at 3 days and 1 day before a tracked bid closes."
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 600 }}>Active</span>
              <Toggle id="deadline-reminders" checked={true} onChange={() => {}} disabled={true} />
            </div>
          </SettingRow>
        </div>


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
