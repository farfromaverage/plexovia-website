"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Crown, ArrowLeft, Lock } from "lucide-react";

export default function TeamPage() {
  const [plan, setPlan]   = useState<string>("trial");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan, email").eq("id", user.id).single();
      if (data) {
        setPlan(data.plan ?? "trial");
        setEmail(data.email ?? user.email ?? "");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingShell />;

  const isPro = plan === "pro";

  return (
    <div style={page}>
      {/* Back nav */}
      <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#6B6560", fontSize: "0.875rem", textDecoration: "none", marginBottom: "2rem", fontFamily: "var(--font-inter), sans-serif" }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.375rem" }}>
        <Users size={22} color="#C9A84C" />
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#F7F5F0", letterSpacing: "-0.04em", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>
          Team Seats
        </h1>
        {isPro && (
          <span style={{ padding: "3px 10px", background: "#C9A84C18", border: "1px solid #C9A84C40", borderRadius: "9999px", fontSize: "0.75rem", color: "#C9A84C", fontWeight: 600, fontFamily: "var(--font-geist-mono, monospace)" }}>
            PRO
          </span>
        )}
      </div>
      <p style={{ color: "#6B6560", fontSize: "0.9rem", margin: "0 0 2rem", fontFamily: "var(--font-inter), sans-serif" }}>
        {isPro
          ? "Your Pro plan includes up to 3 seats. Each teammate gets their own NAICS and state profile."
          : "Team seats are available on Pro. Upgrade to add up to 3 teammates."}
      </p>

      {/* Current owner seat */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#F7F5F0", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>Team Members</h2>
          <span style={{ fontSize: "0.78125rem", color: "#6B6560", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {isPro ? "1 / 3 seats used" : "1 / 1 seat"}
          </span>
        </div>

        {/* Owner row */}
        <div style={memberRow}>
          <div style={{ width: "36px", height: "36px", borderRadius: "9999px", background: "#C9A84C20", border: "1px solid #C9A84C40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Crown size={16} color="#C9A84C" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.875rem", color: "#F7F5F0", margin: 0, fontWeight: 600, fontFamily: "var(--font-inter), sans-serif" }}>{email}</p>
            <p style={{ fontSize: "0.78125rem", color: "#6B6560", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>Owner</p>
          </div>
          <span style={{ padding: "3px 10px", background: "#C9A84C18", border: "1px solid #C9A84C30", borderRadius: "9999px", fontSize: "0.72rem", color: "#C9A84C", fontFamily: "var(--font-geist-mono, monospace)" }}>
            Active
          </span>
        </div>

        {/* Empty seat slots (Pro only) */}
        {isPro && (
          <>
            <EmptySeat label="Seat 2" />
            <EmptySeat label="Seat 3" />
          </>
        )}
      </div>

      {/* Invite section (Pro only) */}
      {isPro ? (
        <div style={{ ...card, marginTop: "1.25rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#F7F5F0", margin: "0 0 0.375rem", fontFamily: "var(--font-inter), sans-serif" }}>Invite a Teammate</h2>
          <p style={{ fontSize: "0.8125rem", color: "#6B6560", margin: "0 0 1rem", fontFamily: "var(--font-inter), sans-serif" }}>
            They will receive a setup email and create their own NAICS + state profile under your account.
          </p>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <input
              type="email"
              placeholder="teammate@company.com"
              style={{ flex: 1, padding: "10px 14px", background: "#2A2724", border: "1px solid #3D3830", borderRadius: "9px", color: "#F7F5F0", fontSize: "0.875rem", outline: "none", fontFamily: "var(--font-inter), sans-serif" }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#3D3830")}
            />
            <div style={{ position: "relative" }}>
              <button
                type="button"
                title="Invites coming soon"
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", background: "#2A2724", border: "1px solid #3D3830", borderRadius: "9px", color: "#6B6560", fontSize: "0.875rem", cursor: "not-allowed", fontFamily: "var(--font-inter), sans-serif", whiteSpace: "nowrap" }}
              >
                <Mail size={14} /> Send Invite
              </button>
              <span style={{ position: "absolute", top: "-10px", right: "-4px", padding: "2px 7px", background: "#1C1917", border: "1px solid #3D3830", borderRadius: "9999px", fontSize: "0.65rem", color: "#A8A29E", whiteSpace: "nowrap" }}>
                Coming soon
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, marginTop: "1.25rem", border: "1px solid #3D3830", background: "#1E1C1A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
            <Lock size={16} color="#6B6560" />
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#A8A29E", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>Invite Teammates</h2>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#6B6560", margin: "0 0 1.25rem", lineHeight: 1.55, fontFamily: "var(--font-inter), sans-serif" }}>
            Pro plan includes 3 seats. Each team member gets their own NAICS code and state profile, and receives their own daily email digest. $299/mo. Cancel anytime.
          </p>
          <Link
            href="/pricing"
            style={{ display: "inline-block", padding: "10px 20px", background: "#C9A84C", color: "#1C1917", borderRadius: "9px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", fontFamily: "var(--font-inter), sans-serif" }}
          >
            Upgrade to Pro
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptySeat({ label }: { label: string }) {
  return (
    <div style={{ ...memberRow, borderTop: "1px solid #2D2A26", marginTop: "8px", paddingTop: "12px", opacity: 0.5 }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "9999px", background: "#2A2724", border: "1px dashed #3D3830", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Users size={15} color="#6B6560" />
      </div>
      <p style={{ fontSize: "0.875rem", color: "#6B6560", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>{label} — empty</p>
    </div>
  );
}

function LoadingShell() {
  return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "28px", height: "28px", border: "3px solid #2D2A26", borderTopColor: "#C9A84C", borderRadius: "9999px", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh", background: "#1C1917",
  padding: "2.5rem 1.5rem",
  maxWidth: "640px", margin: "0 auto",
  fontFamily: "var(--font-inter), sans-serif",
};
const card: React.CSSProperties = {
  background: "#252320", border: "1px solid #2D2A26",
  borderRadius: "14px", padding: "1.5rem",
};
const memberRow: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "12px",
};
