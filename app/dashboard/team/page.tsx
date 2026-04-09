"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, UserPlus, Mail, Crown, Shield, User,
  RefreshCw, Clock, Send,
} from "lucide-react";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import ConfirmModal from "../components/ConfirmModal";

/* ─── Types ───────────────────────────────────────────────────── */
interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "pending" | "invited";
  joined_at: string | null;
  invited_at: string | null;
}

type Role = "admin" | "member";

/* ─── Helpers ─────────────────────────────────────────────────── */
function roleMeta(role: string) {
  if (role === "owner") return { icon: <Crown size={12} aria-hidden="true" />, color: "var(--accent)",   label: "Owner: full access, cannot be removed" };
  if (role === "admin") return { icon: <Shield size={12} aria-hidden="true" />, color: "#4ADE80",        label: "Admin: can invite, view all contracts, manage members" };
  return                        { icon: <User size={12} aria-hidden="true" />,   color: "var(--app-muted)", label: "Member: can view their own data only" };
}
function fmtDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function mapApiError(e: string): string {
  if (e.includes("already") || e.includes("duplicate")) return "This email is already on your team.";
  if (e.includes("invalid") || e.includes("email"))    return "Please enter a valid email address.";
  if (e.includes("403") || e.includes("Forbidden"))    return "You don't have permission to perform this action.";
  if (e.includes("429"))                               return "Too many requests. Please wait a moment.";
  return e || "An unexpected error occurred.";
}

/* ─── Role legend ─────────────────────────────────────────────── */
function RoleLegend() {
  return (
    <details style={{ marginBottom: "1.25rem" }}>
      <summary
        style={{ fontSize: "0.8125rem", color: "var(--app-muted)", cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
      >
        <Shield size={12} aria-hidden="true" /> Role permissions
      </summary>
      <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {["owner", "admin", "member"].map(r => {
          const m = roleMeta(r);
          return (
            <div key={r} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ color: m.color, marginTop: 2 }}>{m.icon}</span>
              <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: 0 }}>
                <strong style={{ color: "var(--app-text)", textTransform: "capitalize" }}>{r}</strong>: {m.label.split(": ").slice(1).join(": ")}
              </p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function TeamPage() {
  const [members,     setMembers]     = useState<TeamMember[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"owner"|"admin"|"member">("member");

  // Invite form
  const [inviteEmail,     setInviteEmail]     = useState("");
  const [inviteRole,      setInviteRole]      = useState<Role>("member");
  const [inviteLoading,   setInviteLoading]   = useState(false);
  const [inviteError,     setInviteError]     = useState<string | null>(null);
  const [inviteSuccess,   setInviteSuccess]   = useState(false);

  // Resend invite
  const [resending, setResending] = useState<string | null>(null);

  // Remove confirm
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const [removing,      setRemoving]      = useState<string | null>(null);

  // Role change
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUser(session.user.email ?? null);

      const res = await fetch("/api/team-members");
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const list: TeamMember[] = json.members || [];
      setMembers(list);
      const me = list.find(m => m.email === session.user.email);
      if (me) setCurrentRole(me.role);
    } catch (e) {
      setError(e instanceof Error ? mapApiError(e.message) : "Could not load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unexpected error" }));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setInviteSuccess(true);
      setInviteEmail("");
      await load();
    } catch (e) {
      setInviteError(mapApiError(e instanceof Error ? e.message : "Invite failed."));
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleResendInvite(member: TeamMember) {
    setResending(member.id);
    try {
      await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, role: member.role, resend: true }),
      });
    } finally {
      setResending(null);
    }
  }

  async function handleRemove() {
    if (!confirmRemove) return;
    setRemoving(confirmRemove.id);
    setConfirmRemove(null);
    try {
      const res = await fetch(`/api/team-members?id=${confirmRemove.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setMembers(prev => prev.filter(m => m.id !== confirmRemove.id));
    } catch (e) {
      setError(mapApiError(e instanceof Error ? e.message : "Could not remove member."));
    } finally {
      setRemoving(null);
    }
  }

  async function handleRoleChange(member: TeamMember, newRole: Role) {
    setChangingRole(member.id);
    try {
      const res = await fetch("/api/team-members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, role: newRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to change role");
      }
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
    } catch (e) {
      setError(mapApiError(e instanceof Error ? e.message : "Could not change role."));
    } finally {
      setChangingRole(null);
    }
  }

  const canManage = currentRole === "owner" || currentRole === "admin";
  const activeMembers = members.filter(m => m.status === "active");
  const pendingMembers = members.filter(m => m.status !== "active");

  return (
    <div className="dash-main">

      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Team</h1>
          <p className="dash-page-sub">
            {members.length} member{members.length !== 1 ? "s" : ""} · {pendingMembers.length > 0 ? `${pendingMembers.length} pending invite${pendingMembers.length !== 1 ? "s" : ""}` : "All invites accepted"}
          </p>
        </div>
        <button
          className="dash-btn"
          onClick={load}
          disabled={loading}
          aria-label="Refresh team list"
        >
          <RefreshCw size={12} aria-hidden="true" />
        </button>
      </div>

      {/* Role permissions legend */}
      <RoleLegend />

      {/* Invite form */}
      {canManage && (
        <div className="dash-section" style={{ marginBottom: "1.5rem" }}>
          <h2 className="dash-section-h">
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <UserPlus size={15} aria-hidden="true" /> Invite team member
            </span>
          </h2>
          <form onSubmit={handleInvite} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }} noValidate>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label htmlFor="invite-email" className="dash-label">Email address</label>
              <input
                id="invite-email"
                type="email"
                autoComplete="off"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="dash-input-lg"
                disabled={inviteLoading}
                required
                aria-required="true"
                aria-describedby={inviteError ? "invite-error" : undefined}
              />
            </div>
            <div style={{ minWidth: 120 }}>
              <label htmlFor="invite-role" className="dash-label">Role</label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as Role)}
                className="dash-input-lg"
                disabled={inviteLoading}
                style={{ cursor: "pointer" }}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="submit"
                disabled={inviteLoading || !inviteEmail.trim()}
                className="dash-btn dash-btn-primary"
                style={{ minHeight: 42, padding: "0 1.25rem", gap: 6 }}
              >
                <Mail size={13} aria-hidden="true" />
                {inviteLoading ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>

          {inviteError && (
            <div id="invite-error" className="dash-alert-error" role="alert" style={{ marginTop: "0.75rem" }}>
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="dash-alert-success" role="status" style={{ marginTop: "0.75rem" }}>
              Invite sent. They'll receive an email with instructions to join.
            </div>
          )}
        </div>
      )}

      {/* Global error */}
      {error && !loading && (
        <div className="dash-alert-error" role="alert" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Member table */}
      <div className="dash-card">
        {/* Table head */}
        <div
          className="dash-table-head dash-hide-mobile"
          style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px 120px" }}
        >
          <span className="dash-th">Member</span>
          <span className="dash-th">Role</span>
          <span className="dash-th">Joined / Invited</span>
          {canManage && <span className="dash-th">Actions</span>}
        </div>

        {loading ? (
          <div aria-label="Loading team members" aria-busy="true">
            {[1,2,3].map(i => (
              <div key={i} style={{ padding: "1rem 1.5rem", display: "flex", gap: "1rem", borderBottom: "1px solid var(--app-border)" }}>
                <div className="dash-skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <div className="dash-skeleton" style={{ height: 14, width: "40%", marginBottom: 6 }} />
                  <div className="dash-skeleton" style={{ height: 11, width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="No team members yet"
            message="Invite a colleague to share access to your contract intelligence dashboard."
          />
        ) : (
          members.map(m => (
            <TeamMemberRow
              key={m.id}
              member={m}
              isCurrentUser={m.email === currentUser}
              canManage={canManage}
              removing={removing === m.id}
              changingRole={changingRole === m.id}
              resending={resending === m.id}
              onRemove={() => setConfirmRemove(m)}
              onRoleChange={(role) => handleRoleChange(m, role)}
              onResendInvite={() => handleResendInvite(m)}
            />
          ))
        )}
      </div>

      {/* Confirm remove modal */}
      {confirmRemove && (
        <ConfirmModal
          title={`Remove ${confirmRemove.name ?? confirmRemove.email}?`}
          message={`This will immediately revoke their access to the Plexovia dashboard. They'll need a new invite to rejoin.`}
          confirmLabel="Yes, remove"
          cancelLabel="Keep them"
          danger
          onConfirm={handleRemove}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}

/* ─── Member row ──────────────────────────────────────────────── */
function TeamMemberRow({
  member, isCurrentUser, canManage, removing, changingRole, resending,
  onRemove, onRoleChange, onResendInvite,
}: {
  member: TeamMember;
  isCurrentUser: boolean;
  canManage: boolean;
  removing: boolean;
  changingRole: boolean;
  resending: boolean;
  onRemove: () => void;
  onRoleChange: (r: Role) => void;
  onResendInvite: () => void;
}) {
  const rm = roleMeta(member.role);
  const isPending = member.status !== "active";

  return (
    <div
      className="dash-table-row"
      style={{
        display: "grid",
        gridTemplateColumns: `1fr 120px 130px${canManage ? " 120px" : ""}`,
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1.5rem",
        opacity: removing ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Avatar + name + email */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--app-surface-2)", border: "1px solid var(--app-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {(member.name ?? member.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--app-text)", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
            {member.name ?? member.email.split("@")[0]}
            {isCurrentUser && (
              <span style={{ fontSize: "0.65rem", color: "var(--app-faint)", fontWeight: 400 }}>(you)</span>
            )}
            {isPending && (
              <span className="dash-tag dash-tag-amber" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                <Clock size={9} aria-hidden="true" /> Pending
              </span>
            )}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0 }} title={member.email}>
            {member.email}
          </p>
        </div>
      </div>

      {/* Role (editable for non-owners if canManage) */}
      <div>
        {canManage && !isCurrentUser && member.role !== "owner" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: rm.color }} aria-hidden="true">{rm.icon}</span>
            <select
              value={member.role}
              onChange={e => onRoleChange(e.target.value as Role)}
              disabled={changingRole}
              aria-label={`Change role for ${member.email}`}
              style={{
                background: "var(--app-surface-2)",
                border: "1px solid var(--app-border)",
                borderRadius: "6px",
                color: "var(--app-text)",
                fontSize: "0.8rem",
                padding: "4px 8px",
                cursor: "pointer",
                fontFamily: "inherit",
                outline: "none",
                opacity: changingRole ? 0.5 : 1,
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: rm.color }} aria-label={`Role: ${member.role}`}>{rm.icon}</span>
            <span style={{ fontSize: "0.8rem", color: rm.color, fontWeight: 500, textTransform: "capitalize" }}>
              {member.role}
            </span>
          </div>
        )}
      </div>

      {/* Date */}
      <div>
        <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0 }}>
          {isPending
            ? `Invited ${fmtDate(member.invited_at)}`
            : fmtDate(member.joined_at)}
        </p>
      </div>

      {/* Actions */}
      {canManage && (
        <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
          {isPending && (
            <button
              className="dash-btn"
              onClick={onResendInvite}
              disabled={resending}
              aria-label={`Resend invite to ${member.email}`}
              title="Resend invite"
              style={{ padding: "4px 8px", minHeight: 30, gap: 3, fontSize: "0.72rem" }}
            >
              <Send size={10} aria-hidden="true" />
              {resending ? "…" : "Resend"}
            </button>
          )}
          {!isCurrentUser && member.role !== "owner" && (
            <button
              className="dash-btn dash-btn-danger"
              onClick={onRemove}
              disabled={removing}
              aria-label={`Remove ${member.name ?? member.email} from team`}
              style={{ padding: "4px 8px", minHeight: 30, fontSize: "0.72rem" }}
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
