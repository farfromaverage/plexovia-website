"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Crown, ArrowLeft, Plus } from "lucide-react";

export default function TeamPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const [teamData, setTeamData] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadTeam = async () => {
    try {
      const res = await fetch("/api/team-members");
      if (res.ok) {
        const data = await res.json();
        setTeamData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      await loadTeam();
      setLoading(false);
    })();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: "member" })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.detail || "Failed to invite user");
      } else {
        setInviteEmail("");
        await loadTeam();
      }
    } catch (err) {
      setErrorMsg("Network error trying to invite member.");
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`/api/team-members/${id}`, { method: "DELETE" });
      if (res.ok) await loadTeam();
    } catch (err) {
      console.error("Failed to remove", err);
    }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      const res = await fetch(`/api/team-members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) await loadTeam();
    } catch (err) {
      console.error("Failed to change role", err);
    }
  };

  if (loading) return <LoadingShell />;

  const seatsUsed = teamData?.seats_used || 1;
  const seatsLimit = teamData?.seats_limit || 10;
  const members = teamData?.members || [];

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
      <p style={{ color: "#6B6560", fontSize: "0.9rem", margin: "0 0 2rem", lineHeight: 1.5, fontFamily: "var(--font-inter), sans-serif" }}>
        Invite teammates to share your workspace boundaries. You are currently using {seatsUsed} of {seatsLimit} included seats.
      </p>

      {/* Seat usage progress */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#A8A29E", marginBottom: "0.5rem" }}>
          <span>{seatsUsed} of {seatsLimit} seats used</span>
          <span>{seatsLimit > seatsUsed ? seatsLimit - seatsUsed + " remaining" : "Limit reached"}</span>
        </div>
        <div style={{ width: "100%", height: "6px", background: "#2D2A26", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ width: `${(seatsUsed / seatsLimit) * 100}%`, height: "100%", background: "#C9A84C", borderRadius: "99px", transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Invite Member form */}
      <form onSubmit={handleInvite} style={{ ...card, marginBottom: "1.25rem", padding: "1.25rem 1.5rem" }}>
        <h2 style={{ fontWeight: 600, fontSize: "0.95rem", color: "#F7F5F0", margin: "0 0 0.75rem", fontFamily: "var(--font-inter), sans-serif" }}>Invite Teammate</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Mail size={15} color="#6B6560" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Colleague's email address"
              required
              disabled={inviting || seatsUsed >= seatsLimit}
              style={{ width: "100%", background: "#1C1917", border: "1px solid #3D3830", borderRadius: "8px", padding: "0.65rem 1rem 0.65rem 2.25rem", color: "#F7F5F0", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>
          <button 
            type="submit" 
            disabled={inviting || seatsUsed >= seatsLimit}
            style={{ minWidth: "100px", background: seatsUsed >= seatsLimit ? "#2D2A26" : "#F7F5F0", color: seatsUsed >= seatsLimit ? "#6B6560" : "#1C1917", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", cursor: seatsUsed >= seatsLimit ? "not-allowed" : "pointer", transition: "opacity 0.2s", opacity: inviting ? 0.7 : 1 }}
          >
            {inviting ? "Inviting..." : "Send Invite"}
          </button>
        </div>
        {errorMsg && <p style={{ color: "#F87171", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>{errorMsg}</p>}
      </form>

      {/* Current owner seat */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #2D2A26" }}>
          <h2 style={{ fontWeight: 600, fontSize: "0.95rem", color: "#F7F5F0", margin: 0, fontFamily: "var(--font-inter), sans-serif" }}>Team List</h2>
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
        </div>

        {/* Invited members */}
        {members.map((m: any) => (
          <div key={m.id} style={{ ...memberRow, marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #2D2A26" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9999px", background: "#3D3830", border: "1px solid #4D4840", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={16} color="#A8A29E" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.875rem", color: "#F7F5F0", margin: 0, fontWeight: 500, fontFamily: "var(--font-inter), sans-serif" }}>{m.email}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <span style={{ fontSize: "0.75rem", color: m.status === "active" ? "#4ADE80" : "#FBBF24", fontFamily: "var(--font-inter), sans-serif" }}>
                  {m.status === "active" ? "Active" : "Pending"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#6B6560" }}>•</span>
                <span 
                  onClick={() => toggleRole(m.id, m.role)}
                  style={{ fontSize: "0.75rem", color: "#A8A29E", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }}
                >
                  {m.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeMember(m.id)}
              style={{ background: "transparent", border: "1px solid #3D3830", color: "#A8A29E", borderRadius: "6px", padding: "6px 12px", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
        ))}
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
