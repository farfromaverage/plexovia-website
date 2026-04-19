"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import {
  FileText, TrendingUp, MapPin, Zap, ArrowUpRight,
  Shield, ExternalLink, Tag, RefreshCw, AlertCircle, Settings, ChevronRight,
} from "lucide-react";
import ScoreBadge from "./components/ScoreBadge";

/* ─── Types ───────────────────────────────────────────────────────── */
interface Profile {
  id: string; email: string | null; company_name: string | null;
  plan: string | null; trial_ends_at: string | null;
  onboarding_complete: boolean | null;
  naics_codes:           string[] | null;
  states:                string[] | null;
  keywords:              string[] | null;
  set_aside_preferences: string[] | null;
}

interface ContractDisplay {
  id: string; title: string; agency: string; naics: string;
  state: string; value: string; posted: string; deadline: string;
  deadlineDays: number | null;
  score: number; type: string; matchedBy: "naics" | "keyword";
  matchLabel: string; url: string | null;
  rawPosted: string | null; rawMatchedAt: string | null;
}

const SET_ASIDE_LABELS: Record<string, string> = {
  "8a":"8(a)", "wosb":"WOSB", "sdvosb":"SDVOSB",
  "hubzone":"HUBZone", "vosb":"VOSB", "sdb":"SDB",
};

/* ─── Formatters ──────────────────────────────────────────────────── */
function fmt$(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtVal(min: number | null, max: number | null) {
  if (!min && !max) return "Value TBD";
  if (min && max && min !== max) return `${fmt$(min)} to ${fmt$(max)}`;
  return fmt$(min || max || 0);
}
function fmtPosted(d: string | null) {
  if (!d) return "Recently";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDeadline(d: string | null): { label: string; days: number | null } {
  if (!d) return { label: "TBD", days: null };
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { label: "Expired",        days };
  if (days === 0) return { label: "Due today",     days: 0 };
  if (days === 1) return { label: "Due tomorrow",  days: 1 };
  if (days <= 14) return { label: `Due in ${days} days`, days };
  return { label: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }), days };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMatch(m: any): ContractDisplay {
  const reasons     = m.reasons || [];
  const naicsReason = reasons.find((r: string) => r.startsWith("naics:"));
  const kwReason    = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy   = naicsReason ? "naics" : "keyword";
  const matchLabel  = naicsReason
    ? `NAICS ${naicsReason.replace("naics:", "")}`
    : kwReason ? `Keyword: ${kwReason.replace("keyword:", "")}` : "Keyword match";
  const c = m.contract || {};
  const dl = fmtDeadline(c.deadline);
  return {
    id: m.match_id, title: c.title || "Untitled Contract",
    agency: c.agency || "Federal Agency", naics: c.naics_code || "",
    state: c.state || "Federal",
    value: fmtVal(c.value_min, c.value_max),
    posted: fmtPosted(c.posted_date), deadline: dl.label, deadlineDays: dl.days,
    score: m.score, type: c.set_aside || "Full & Open",
    matchedBy, matchLabel, url: c.url || null,
    rawPosted: c.posted_date || null, rawMatchedAt: m.matched_at || null,
  };
}

/* ─── Contract row ─────────────────────────────────────────────────── */
function ContractRow({ c }: { c: ContractDisplay }) {
  const deadlineColor =
    c.deadline === "Expired" ? "#F87171"
    : c.deadlineDays !== null && c.deadlineDays <= 7 ? "#FBBF24"
    : "var(--app-muted)";
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "1rem 1.5rem", borderBottom: "1px solid var(--app-border)",
        gap: "1rem", transition: "background 0.12s", cursor: "default",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--app-surface-2)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px", flexWrap: "wrap" }}>
          <ScoreBadge score={c.score} />
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", fontSize: "0.72rem", borderRadius: 4,
              color: c.matchedBy === "naics" ? "#86EFAC" : "#93C5FD",
              background: c.matchedBy === "naics" ? "rgba(134,239,172,0.08)" : "rgba(147,197,253,0.08)",
              border: `1px solid ${c.matchedBy === "naics" ? "rgba(134,239,172,0.2)" : "rgba(147,197,253,0.2)"}`,
            }}
          >
            {c.matchedBy === "naics" ? <FileText size={10} aria-hidden="true" /> : <Tag size={10} aria-hidden="true" />}
            {c.matchLabel}
          </span>
        </div>
        <p style={{
          fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)",
          margin: "0 0 4px", lineHeight: 1.35,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 460,
        }}>
          {c.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 3 }}>
            <Shield size={10} aria-hidden="true" color="var(--app-faint)" /> {c.agency}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin size={10} aria-hidden="true" color="var(--app-faint)" /> {c.state}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--app-muted)" }}>{c.posted}</span>
          <span style={{ fontSize: "0.75rem", color: deadlineColor, fontWeight: c.deadlineDays !== null && c.deadlineDays <= 7 ? 600 : 400 }}>
            {c.deadline}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <span className="dash-mono" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text)" }}>
          {c.value}
        </span>
        {c.url ? (
          <a
            href={c.url} target="_blank" rel="noopener noreferrer"
            aria-label={`View on SAM.gov: ${c.title}`}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "4px 10px", background: "none",
              border: "1px solid var(--app-border)", borderRadius: "7px",
              color: "var(--app-muted)", fontSize: "0.75rem", textDecoration: "none",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--app-border)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--app-muted)"; }}
          >
            SAM.gov <ExternalLink size={10} aria-hidden="true" />
          </a>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "var(--app-faint)", padding: "4px 0" }}>No URL</span>
        )}
      </div>
    </div>
  );
}

/* ─── Quick stat card ─────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="dash-stat-card" style={{ border: accent ? "1px solid rgba(201,168,76,0.2)" : undefined, background: accent ? "linear-gradient(135deg,rgba(201,168,76,0.05),var(--app-surface))" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="dash-label" style={{ marginBottom: 0 }}>{label}</span>
        <span style={{ color: accent ? "var(--accent)" : "var(--app-faint)" }}>{icon}</span>
      </div>
      <p className="dash-mono" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--app-text)", margin: "0 0 4px", letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: "0.72rem", color: "var(--app-faint)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();

  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [matches,        setMatches]        = useState<ContractDisplay[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchTotal,     setMatchTotal]     = useState(0);
  const [matchError,     setMatchError]     = useState(false);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    setMatchError(false);
    try {
      const res = await fetch("/api/user-matches?per_page=10&sort=score");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMatches((json.matches || []).map(mapMatch));
      setMatchTotal(json.pagination?.total || 0);
    } catch {
      setMatchError(true);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("id,email,company_name,plan,trial_ends_at,onboarding_complete,naics_codes,states,keywords,set_aside_preferences")
        .eq("id", userId)
        .single();
      setProfile(data);
      setLoading(false);
      fetchMatches();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) { router.replace("/auth/login"); return; }
        if (session) loadProfile(session.user.id);
      }
    );
    const fallback = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.replace("/auth/login");
      else if (loading) loadProfile(session.user.id);
    }, 800);

    return () => { subscription.unsubscribe(); clearTimeout(fallback); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} aria-label="Loading dashboard…" role="status" />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* Derived values */
  const emailSlug    = profile?.email?.split("@")[0] ?? "";
  const slugIsClean  = emailSlug.length > 0 && !/\d{3,}/.test(emailSlug) && !/^\d/.test(emailSlug);
  const displayName  = profile?.company_name || (slugIsClean ? emailSlug : "there");
  const naicsCount   = profile?.naics_codes?.length ?? 0;
  const stateCount   = profile?.states?.length       ?? 0;
  const keywordCount = profile?.keywords?.length     ?? 0;
  const setAsides    = profile?.set_aside_preferences ?? [];
  const setupDone    = naicsCount > 0;
  const isTrial      = !profile?.plan || profile.plan === "trial";
  const daysLeft     = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const subtitle     = setupDone
    ? `Monitoring ${stateCount} state${stateCount !== 1 ? "s" : ""} · ${naicsCount} NAICS code${naicsCount !== 1 ? "s" : ""}${keywordCount > 0 ? ` · ${keywordCount} keyword${keywordCount !== 1 ? "s" : ""}` : ""} · Updated daily`
    : "Complete your setup below to activate contract monitoring";

  /* 14-day mini chart */
  const chartDays = 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const chartData = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (chartDays - 1 - i));
    return { date: d, count: 0 };
  });
  matches.forEach(m => {
    const src = m.rawPosted || m.rawMatchedAt;
    if (!src) return;
    const mDate = new Date(src); mDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - mDate.getTime()) / 86400000);
    if (diff >= 0 && diff < chartDays) chartData[chartDays - 1 - diff].count++;
  });
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="dash-main">

      {/* Greeting + trial badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--app-text)", margin: 0, letterSpacing: "-0.03em" }}>
            {greeting}, {displayName} 👋
          </h1>
          <p style={{ color: "var(--app-muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{subtitle}</p>
        </div>
        {isTrial && daysLeft !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "var(--app-surface)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "block" }} aria-hidden="true" />
            <span style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 600 }}>Free Trial</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left ·</span>
            <Link href="/dashboard/billing" style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "2px" }}>
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Setup prompt */}
      {!setupDone && (
        <div style={{
          background: "linear-gradient(135deg,rgba(201,168,76,0.06),transparent)",
          border: "1px solid rgba(201,168,76,0.22)", borderRadius: "12px",
          padding: "1.25rem 1.5rem", display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap",
        }}
          role="alert"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "9px", background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Settings size={17} color="var(--accent)" aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-text)", margin: 0 }}>Complete your monitoring profile</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "3px 0 0" }}>Add NAICS codes, states, and keywords to start receiving matched contracts</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="dash-btn dash-btn-accent" style={{ textDecoration: "none", padding: "9px 20px", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            Set up now <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Active monitoring banner */}
      {setupDone && (
        <div className="dash-alert-success" style={{ marginBottom: "1.5rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", flexShrink: 0, display: "inline-block" }} aria-hidden="true" />
          <span>
            <strong>Monitoring is active.</strong> Government portals scan nightly.
            New matches appear daily in your <strong style={{ color: "var(--app-text)" }}>dashboard</strong>.
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard icon={<FileText size={14} aria-hidden="true" />}   label="Contract Matches" value={matchesLoading ? "…" : String(matchTotal)}       sub={matchTotal > 0 ? `${matchTotal.toLocaleString()} total found` : "Pending nightly scan"} accent />
        <StatCard icon={<TrendingUp size={14} aria-hidden="true" />} label="New This Week"    value={matchesLoading ? "…" : String(matches.filter(m => ["Today","Yesterday"].includes(m.posted) || /^\d+d ago$/.test(m.posted)).length)} sub="Last 7 days" />
        <StatCard icon={<MapPin size={14} aria-hidden="true" />}     label="States Active"    value={stateCount > 0 ? String(stateCount) : "N/A"}          sub={stateCount > 0 ? `${stateCount} state${stateCount !== 1 ? "s" : ""} monitored` : "Not configured"} />
        <StatCard icon={<Zap size={14} aria-hidden="true" />}        label="NAICS Codes"      value={naicsCount > 0 ? String(naicsCount) : "N/A"}          sub={naicsCount > 0 ? "Active industry codes" : "Not configured"} />
        {keywordCount > 0 && (
          <StatCard icon={<Tag size={14} aria-hidden="true" />}      label="Keywords"         value={String(keywordCount)}                               sub="Active keyword matching" />
        )}
        <Link href="/dashboard/intelligence" style={{ textDecoration: "none" }}>
          <StatCard icon={<Zap size={14} aria-hidden="true" />}     label="Intelligence"     value="View"                                               sub="Signals & win probability" accent />
        </Link>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: "1.5rem", alignItems: "start" }} className="dash-2col">

        {/* Left: minigraph + contract feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* 14-day mini chart */}
          <div className="dash-card" style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--app-text)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Match Volume</h2>
                <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "3px 0 0" }}>Daily activity, last {chartDays} days</p>
              </div>
              <span className="dash-mono" style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--accent)", letterSpacing: "-0.03em" }}>
                +{chartData.reduce((a, c) => a + c.count, 0)}
              </span>
            </div>
            <div
              role="img"
              aria-label={`Bar chart of contract match volume over last ${chartDays} days`}
              style={{ height: 80, display: "flex", alignItems: "flex-end", gap: 3, paddingBottom: 8, borderBottom: "1px dashed var(--app-border)" }}
            >
              {chartData.map((d, i) => {
                const h = Math.max((d.count / maxCount) * 100, 4);
                const isToday = i === chartDays - 1;
                return (
                  <div
                    key={i}
                    title={`${d.count} match${d.count !== 1 ? "es" : ""}, ${d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column",
                      justifyContent: "flex-end", alignItems: "center",
                    }}
                  >
                    <div style={{
                      width: "100%", maxWidth: 14,
                      height: `${h}%`, borderRadius: "3px 3px 0 0",
                      background: isToday ? "var(--accent)" : d.count > 0 ? "var(--app-muted)" : "var(--app-border)",
                      transition: "background 0.15s",
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.6rem", color: "var(--app-faint)", fontWeight: 600, textTransform: "uppercase" }}>
              <span>{chartData[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span>Today</span>
            </div>
          </div>

          {/* Recent matches */}
          <div className="dash-card">
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--app-text)", margin: 0 }}>Recent Contract Matches</h2>
                <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "3px 0 0" }}>Ranked by AI match score</p>
              </div>
              {matches.length > 0 && (
                <Link href="/dashboard/contracts" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                  View all <ArrowUpRight size={12} aria-hidden="true" />
                </Link>
              )}
            </div>

            {matchError && (
              <div style={{ padding: "10px 1.5rem", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--app-border)", background: "rgba(248,113,113,0.05)" }}>
                <AlertCircle size={13} color="#F87171" aria-hidden="true" />
                <span style={{ fontSize: "0.8125rem", color: "#F87171" }}>
                  Could not load contracts.{" "}
                  <button onClick={fetchMatches} style={{ color: "#F87171", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                    Retry
                  </button>
                </span>
              </div>
            )}

            {matchesLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--app-border)" }} aria-hidden="true">
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <div className="dash-skeleton" style={{ width: 42, height: 20, borderRadius: 999 }} />
                      <div className="dash-skeleton" style={{ width: 100, height: 20, borderRadius: 4 }} />
                    </div>
                    <div className="dash-skeleton" style={{ width: "70%", height: 16, borderRadius: 4, marginBottom: 6 }} />
                    <div className="dash-skeleton" style={{ width: "50%", height: 12, borderRadius: 4 }} />
                  </div>
                ))}
                <span className="sr-only">Loading contracts…</span>
              </>
            ) : matches.length > 0 ? (
              matches.slice(0, 10).map(c => <ContractRow key={c.id} c={c} />)
            ) : (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <FileText size={18} color="var(--accent)" aria-hidden="true" />
                </div>
                <p style={{ fontWeight: 600, color: "var(--app-text)", margin: "0 0 0.25rem" }}>No matches yet</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", maxWidth: 260, margin: "0 auto" }}>
                  {setupDone
                    ? "We scan every night. Check back tomorrow morning."
                    : "Set up your NAICS codes and states in Profile to start receiving matches."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: monitoring profile panel */}
        <div>
          <div className="dash-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--app-text)", margin: 0 }}>Monitoring Profile</p>
                <p style={{ fontSize: "0.7rem", color: "var(--app-muted)", margin: "2px 0 0" }}>What the engine tracks for you</p>
              </div>
              <Link href="/dashboard/profile" className="dash-btn" style={{ textDecoration: "none", padding: "4px 10px", fontSize: "0.75rem", minHeight: 28 }}>
                Edit
              </Link>
            </div>
            <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {naicsCount === 0 && stateCount === 0 && keywordCount === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: 0 }}>
                  No profile set up yet.{" "}
                  <Link href="/dashboard/profile" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Configure →</Link>
                </p>
              ) : (
                <>
                  {naicsCount > 0 && (
                    <div>
                      <p className="dash-label" style={{ display: "flex", alignItems: "center", gap: 4 }}><FileText size={10} aria-hidden="true" /> NAICS Codes</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {(profile?.naics_codes ?? []).slice(0, 8).map(code => (
                          <span key={code} className="dash-tag dash-tag-green dash-mono" style={{ fontSize: "0.72rem" }}>{code}</span>
                        ))}
                        {naicsCount > 8 && <span style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>+{naicsCount - 8}</span>}
                      </div>
                    </div>
                  )}
                  {stateCount > 0 && (
                    <div>
                      <p className="dash-label" style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} aria-hidden="true" /> States</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {(profile?.states ?? []).slice(0, 12).map(s => (
                          <span key={s} className="dash-tag dash-tag-blue" style={{ fontSize: "0.72rem" }}>{s}</span>
                        ))}
                        {stateCount > 12 && <span style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>+{stateCount - 12}</span>}
                      </div>
                    </div>
                  )}
                  {keywordCount > 0 && (
                    <div>
                      <p className="dash-label" style={{ display: "flex", alignItems: "center", gap: 4 }}><Tag size={10} aria-hidden="true" /> Keywords</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {(profile?.keywords ?? []).slice(0, 6).map(kw => (
                          <span key={kw} className="dash-tag dash-tag-muted" style={{ fontSize: "0.72rem" }}>{kw}</span>
                        ))}
                        {keywordCount > 6 && <span style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>+{keywordCount - 6}</span>}
                      </div>
                    </div>
                  )}
                  {setAsides.length > 0 && (
                    <div>
                      <p className="dash-label" style={{ display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} aria-hidden="true" /> Set-Asides</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {setAsides.map(sa => (
                          <span key={sa} className="dash-tag dash-tag-amber" style={{ fontSize: "0.72rem" }}>
                            {SET_ASIDE_LABELS[sa.toLowerCase()] ?? sa.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: "0.625rem 1.25rem", borderTop: "1px solid var(--app-border)", display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={10} color="#4ADE80" aria-hidden="true" />
              <span style={{ fontSize: "0.7rem", color: "var(--app-faint)" }}>
                Engine syncs <strong style={{ color: "var(--app-muted)" }}>daily</strong> &middot; dashboard auto-updates
              </span>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) { .dash-2col { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
