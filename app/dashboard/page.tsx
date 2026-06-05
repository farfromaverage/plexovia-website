"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  FileText, TrendingUp, MapPin, Zap, ArrowUpRight,
  Shield, ExternalLink, Tag, AlertCircle, Settings, ChevronRight,
} from "lucide-react";
import MatchScoreBadge from "@/components/ui/match-score-badge";
import IntelligenceBriefing from "./components/IntelligenceBriefing";
import { useLastVisit } from "@/hooks/useLastVisit";

/* ─── Types ───────────────────────────────────────────────────────── */
interface Profile {
  id: string; email: string | null;
  plan: string | null; trial_ends_at: string | null;
  onboarding_complete: boolean | null;
  naics_codes: string[] | null; states: string[] | null;
  keywords: string[] | null; set_aside_preferences: string[] | null;
}
interface ContractDisplay {
  id: string; title: string; agency: string; naics: string;
  state: string; posted: string; deadline: string;
  deadlineDays: number | null; score: number; type: string;
  matchedBy: "naics" | "keyword"; matchLabel: string; url: string | null;
  rawPosted: string | null; rawMatchedAt: string | null;
}

/* ─── Formatters ──────────────────────────────────────────────────── */

function fmtPosted(d: string | null) {
  if (!d) return "Recently";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDeadline(d: string | null): { label: string; days: number | null } {
  if (!d) return { label: "Not Listed", days: null };
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0)  return { label: "Expired", days };
  if (days === 0) return { label: "Due today", days: 0 };
  if (days === 1) return { label: "Due tomorrow", days: 1 };
  if (days <= 14) return { label: `Due in ${days} days`, days };
  return { label: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }), days };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMatch(m: any): ContractDisplay {
  const reasons = m.reasons || [];
  const naicsReason = reasons.find((r: string) => r.startsWith("naics:"));
  const kwReason = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy = naicsReason ? "naics" : "keyword";
  const matchLabel = naicsReason
    ? `NAICS ${naicsReason.replace("naics:", "")}`
    : kwReason ? `Keyword: ${kwReason.replace("keyword:", "")}` : "Keyword match";
  const c = m.contract || {};
  const dl = fmtDeadline(c.deadline);
  return {
    id: m.match_id, title: c.title || "Untitled Contract",
    agency: c.agency || "Federal Agency", naics: c.naics_code || "",
    state: c.state || "Nationwide",
    posted: fmtPosted(c.posted_date), deadline: dl.label, deadlineDays: dl.days,
    score: m.score, type: c.set_aside || "Full & Open",
    matchedBy, matchLabel, url: c.url || null,
    rawPosted: c.posted_date || null, rawMatchedAt: m.matched_at || null,
  };
}

/* ─── Contract Row ─────────────────────────────────────────────────── */
function ContractRow({ c }: { c: ContractDisplay }) {
  const deadlineColor =
    c.deadline === "Expired" ? "var(--danger)"
    : c.deadlineDays !== null && c.deadlineDays <= 7 ? "var(--warning)"
    : "var(--app-muted)";
  return (
    <div className="dash-contract-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
          <MatchScoreBadge score={c.score} />
          <span className="dash-match-tag" data-type={c.matchedBy}>
            {c.matchedBy === "naics" ? <FileText size={10} aria-hidden="true" /> : <Tag size={10} aria-hidden="true" />}
            {c.matchLabel}
          </span>
        </div>
        <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 460 }}>
          {c.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 3 }}>
            <Shield size={10} aria-hidden="true" style={{ color: "var(--app-faint)" }} /> {c.agency}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin size={10} aria-hidden="true" style={{ color: "var(--app-faint)" }} /> {c.state || "Nationwide"}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--app-muted)" }}>{c.posted}</span>
          <span style={{ fontSize: "0.75rem", color: deadlineColor, fontWeight: c.deadlineDays !== null && c.deadlineDays <= 7 ? 600 : 400 }}>
            {c.deadline}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <span className="dash-mono" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text)" }}>{c.posted}</span>
        {c.url ? (
          <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`View on SAM.gov: ${c.title}`} className="dash-link-external">
            SAM.gov <ExternalLink size={10} aria-hidden="true" />
          </a>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "var(--app-faint)", padding: "4px 0" }}>No URL</span>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
}) {
  return (
    <div className="dash-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="dash-label" style={{ marginBottom: 0 }}>{label}</span>
        <span style={{ color: "var(--app-faint)" }}>{icon}</span>
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<ContractDisplay[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchTotal, setMatchTotal] = useState(0);
  const [matchError, setMatchError] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [staleData, setStaleData] = useState(false);

  const { newCount } = useLastVisit(matches.map(m => m.rawMatchedAt));

  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stalePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPipelineAtRef = useRef<string | null>(null);
  const loadedRef = useRef(false);
  const fetchMatchesRef = useRef<(revalidate?: boolean) => Promise<number>>(async () => -1);
  const retryCountRef = useRef(0);

  const isTransient = (err: unknown): boolean => {
    if (err instanceof DOMException && err.name === "AbortError") return false;
    if (err instanceof TypeError) return true;
    if (err instanceof Error) {
      return /^HTTP (500|502|503|504)$/.test(err.message);
    }
    return false;
  };

  const fetchMatches = useCallback(async (): Promise<number> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setMatchesLoading(true);
    setMatchError(false);
    try {
      const timeoutSignal = AbortSignal.timeout(15000);
      const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal]);
      const res = await fetch("/api/user-matches?per_page=10&sort=recency", { signal: combinedSignal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (controller.signal.aborted) return -1;
      const mapped = (json.matches || []).map(mapMatch);
      setMatches(mapped);
      const total = json.pagination?.total || 0;
      setMatchTotal(total);
      setLastRefreshed(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
      // Sync the pipeline timestamp so the stale poll detects future runs
      if (json.last_pipeline_completed_at) {
        lastPipelineAtRef.current = json.last_pipeline_completed_at;
      }
      retryCountRef.current = 0;
      return total;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return -1;
      if (isTransient(err) && retryCountRef.current < 3) {
        const delays = [3000, 6000, 12000];
        const delay = delays[retryCountRef.current];
        retryCountRef.current++;
        setTimeout(() => { fetchMatchesRef.current(); }, delay);
        return -1;
      }
      setMatchError(true);
      return -1;
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchesRef.current = fetchMatches;
  });

  useEffect(() => {
    async function loadProfile(userId: string) {
      if (loadedRef.current) return;
      loadedRef.current = true;
      const { data } = await supabase
        .from("profiles")
        .select("id,email,plan,trial_ends_at,onboarding_complete,naics_codes,states,keywords,set_aside_preferences")
        .eq("id", userId).single();
      setProfile(data);
      setLoading(false);
      const total = await fetchMatches();
      if (total === 0 && data?.onboarding_complete) {
        setIsPolling(true);
        let elapsed = 0;
        pollRef.current = setInterval(async () => {
          elapsed += 5000;
          const result = await fetchMatches();
          if (result > 0 || elapsed >= 60000) { clearInterval(pollRef.current!); setIsPolling(false); }
        }, 5000);
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) { router.replace("/auth/login"); return; }
      if (session) loadProfile(session.user.id);
    });
    const fallback = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.replace("/auth/login");
      else if (loading) loadProfile(session.user.id);
    }, 800);

    // Start staleness detection — checks pipeline_state timestamp every 60s.
    // Uses last_pipeline_completed_at (deterministic) instead of count comparison
    // (which can drift due to pagination boundaries or timezone shifts).
    stalePollRef.current = setInterval(async () => {
      try {
        const timeoutSignal = AbortSignal.timeout(10000);
        const res = await fetch('/api/overview?period=1', { signal: timeoutSignal });
        if (!res.ok) return;
        const json = await res.json();
        const pipelineAt: string | null = json.last_pipeline_completed_at ?? null;
        if (!pipelineAt) return; // no pipeline has run yet
        if (lastPipelineAtRef.current === null) {
          lastPipelineAtRef.current = pipelineAt;
        } else if (pipelineAt !== lastPipelineAtRef.current) {
          setStaleData(true);
        }
      } catch {
        // best-effort
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
      if (pollRef.current) clearInterval(pollRef.current);
      if (stalePollRef.current) clearInterval(stalePollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="dash-spin" style={{ width: 28, height: 28, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }} aria-label="Loading dashboard…" role="status" />
      </div>
    );
  }

  /* Derived values */
  const naicsCount = profile?.naics_codes?.length ?? 0;
  const stateCount = profile?.states?.length ?? 0;
  const setupDone = naicsCount > 0;
  const isTrial = !profile?.plan || profile.plan === "trial";
  const daysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  /* 14-day mini chart data */
  const chartDays = 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const chartData = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (chartDays - 1 - i));
    return { date: d, count: 0 };
  });
  matches.forEach(m => {
    const src = m.rawMatchedAt;
    if (!src) return;
    const mDate = new Date(src); mDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - mDate.getTime()) / 86400000);
    if (diff >= 0 && diff < chartDays) chartData[chartDays - 1 - diff].count++;
  });
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const recentCount = matches.filter(m => ["Today", "Yesterday"].includes(m.posted) || /^\d+d ago$/.test(m.posted)).length;

  return (
    <div className="dash-main dash-fade-in">

      {/* ── Greeting + trial badge ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--app-text)", margin: 0, letterSpacing: "-0.03em" }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--app-muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            {newCount > 0 ? `${newCount} new contract${newCount !== 1 ? "s" : ""} matched since your last visit` : setupDone ? "All caught up. No new contracts since your last visit." : "Set up your profile to start receiving matched contracts"}
          </p>
          <p style={{ color: "var(--app-faint)", fontSize: "0.72rem", margin: "2px 0 0" }}>
            {lastRefreshed ? `Last updated ${lastRefreshed}` : ""}
          </p>
        </div>
        {isTrial && daysLeft !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--app-surface)", border: "1px solid var(--accent-border)", borderRadius: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "block" }} aria-hidden="true" />
            <span style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 600 }}>Free Trial</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} left ·</span>
            <Link href="/dashboard/billing" style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "2px" }}>Upgrade</Link>
          </div>
        )}
      </div>

      {/* ── Setup prompt ── */}
      {!setupDone && (
        <div className="dash-card" style={{ padding: "var(--space-5) var(--space-6)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)", gap: "var(--space-4)", flexWrap: "wrap", border: "1px solid var(--accent-border)", background: "var(--accent-subtle)" }} role="alert">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--accent-subtle)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Settings size={17} style={{ color: "var(--accent)" }} aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-text)", margin: 0 }}>Finish setting up your profile</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "3px 0 0" }}>Once you add your NAICS codes and target states, we&apos;ll start matching contracts to your business automatically.</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="dash-btn dash-btn-accent" style={{ textDecoration: "none", padding: "9px 20px", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            Complete Profile <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* ── Intelligence Briefing ── */}
      {setupDone && <IntelligenceBriefing newCount={newCount} />}

      {/* ── Stale data banner ── */}
      {staleData && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: "var(--space-5)", background: "var(--warning-subtle)", border: "1px solid var(--accent-border)", borderRadius: 10, fontSize: "0.8125rem", color: "var(--app-text)" }} role="alert">
          <span style={{ fontSize: "1.1rem" }} aria-hidden="true">&#9830;</span>
          <span style={{ flex: 1 }}>New contract matches are available.</span>
          <button onClick={() => { setStaleData(false); lastPipelineAtRef.current = null; fetchMatches(); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem" }}>
            Refresh
          </button>
        </div>
      )}

      {/* ── 4 Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <StatCard icon={<FileText size={14} aria-hidden="true" />} label="Contract Matches" value={matchesLoading ? "…" : isPolling ? "Analyzing…" : String(matchTotal)} sub={isPolling ? "Analyzing federal opportunities for you" : matchTotal > 0 ? `${matchTotal.toLocaleString()} contracts matched to your profile` : "Checked twice daily"} />
        <StatCard icon={<TrendingUp size={14} aria-hidden="true" />} label="New This Week" value={matchesLoading ? "…" : String(recentCount)} sub="Last 7 days" />
        <StatCard icon={<MapPin size={14} aria-hidden="true" />} label="States Active" value={stateCount > 0 ? String(stateCount) : "N/A"} sub={stateCount > 0 ? `${stateCount} state${stateCount !== 1 ? "s" : ""} monitored` : "Not configured"} />
        <StatCard icon={<Zap size={14} aria-hidden="true" />} label="NAICS Codes" value={naicsCount > 0 ? String(naicsCount) : "N/A"} sub={naicsCount > 0 ? "Active NAICS codes" : "Not configured"} />
      </div>

      {/* ── 14-day chart ── */}
      <div className="dash-card" style={{ padding: "var(--space-5) var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--app-text)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contract Match Activity</h2>
            <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "3px 0 0" }}>Daily volume, last {chartDays} days</p>
          </div>
          <span className="dash-mono" style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--accent)", letterSpacing: "-0.03em" }}>
            +{chartData.reduce((a, c) => a + c.count, 0)}
          </span>
        </div>
        <div role="img" aria-label={`Bar chart of contract match volume over last ${chartDays} days`} style={{ height: 80, display: "flex", alignItems: "flex-end", gap: 3, paddingBottom: 8, borderBottom: "1px dashed var(--app-border)" }}>
          {chartData.map((d, i) => {
            const h = Math.max((d.count / maxCount) * 100, 4);
            const isToday = i === chartDays - 1;
            return (
              <div key={i} title={`${d.count} match${d.count !== 1 ? "es" : ""}, ${d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                <div style={{ width: "100%", maxWidth: 14, height: `${h}%`, borderRadius: "3px 3px 0 0", background: isToday ? "var(--accent)" : d.count > 0 ? "var(--app-muted)" : "var(--app-border)", transition: "background 0.15s" }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.6rem", color: "var(--app-faint)", fontWeight: 600, textTransform: "uppercase" }}>
          <span>{chartData[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <span>Today</span>
        </div>
      </div>

      {/* ── Recent Matches ── */}
      <div className="dash-card">
        <div style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--app-text)", margin: 0 }}>Top Contract Matches</h2>
            <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "3px 0 0" }}>Ranked by relevance to your profile</p>
          </div>
          {matchTotal > 0 && (
            <Link href="/dashboard/contracts" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              View all {matchTotal} <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          )}
        </div>

        {matchError && (
          <div role="alert" style={{ padding: "10px var(--space-6)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--app-border)", background: "var(--danger-subtle)" }}>
            <AlertCircle size={13} style={{ color: "var(--danger)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.8125rem", color: "var(--danger)" }}>
              Could not load contracts.{" "}
              <button onClick={fetchMatches} style={{ color: "var(--danger)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>Retry</button>
            </span>
          </div>
        )}

        {matchesLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--app-border)" }} aria-hidden="true">
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
          matches.slice(0, 5).map(c => <ContractRow key={c.id} c={c} />)
        ) : isPolling ? (
          <div style={{ padding: "3rem var(--space-6)", textAlign: "center" }}>
            <div className="dash-spin" style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Zap size={16} style={{ color: "var(--accent)" }} aria-hidden="true" />
            </div>
            <p style={{ fontWeight: 600, color: "var(--app-text)", margin: "0 0 0.25rem" }}>Analyzing federal opportunities</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", maxWidth: 300, margin: "0 auto" }}>Finding contracts that match your NAICS codes and set-aside designations. This usually takes 10–30 seconds.</p>
          </div>
        ) : (
          <div style={{ padding: "3rem var(--space-6)", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <FileText size={18} style={{ color: "var(--accent)" }} aria-hidden="true" />
            </div>
            <p style={{ fontWeight: 600, color: "var(--app-text)", margin: "0 0 0.25rem" }}>No contracts matched yet</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", maxWidth: 260, margin: "0 auto" }}>
              {setupDone ? "We check for new contracts twice daily. Your next batch is on the way." : "Add your NAICS codes and target states in your profile to start receiving contract matches."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
