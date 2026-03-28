"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Crown, ArrowLeft, Plus } from "lucide-react";

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
      </div>
      <p style={{ color: "#6B6560", fontSize: "0.9rem", margin: "0 0 2rem", fontFamily: "var(--font-inter), sans-serif" }}>
        Your account includes 1 user seat. Scale by adding more seats as your team grows.
      </p>

      {/* Current owner seat */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#F7F5F0", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>Team Members</h2>
          <span style={{ fontSize: "0.78125rem", color: "#6B6560", fontFamily: "var(--font-geist-mono, monospace)" }}>
            1 / 1 seat
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
      </div>

      <div style={{ ...card, marginTop: "1.25rem", border: "1px solid #3D3830", background: "#1E1C1A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
          <Plus size={16} color="#C9A84C" />
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#F7F5F0", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>Need more seats?</h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#6B6560", margin: "0 0 1.25rem", lineHeight: 1.55, fontFamily: "var(--font-inter), sans-serif" }}>
          Adding a team seat allows a teammate to set up their own state and NAICS profile, giving them their own independent dashboard and daily digest.
        </p>
        <Link
          href="/dashboard/billing"
          style={{ display: "inline-block", padding: "10px 20px", background: "#3D3830", color: "#F7F5F0", borderRadius: "9px", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", fontFamily: "var(--font-inter), sans-serif" }}
        >
          Manage Seats in Billing
        </Link>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div style={{ ...page, alignItems: "center", justifyContent: "center", display: "flex" }}>
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
