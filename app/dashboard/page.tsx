"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LogOut, FileText, Bell, Settings, ChevronRight,
  TrendingUp, MapPin, Zap, ArrowUpRight, Shield,
  ExternalLink, Tag, RefreshCw, PenLine, Users, AlertCircle,
} from "lucide-react";
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

interface EngineMatch {
  match_id: string;
  score: number;
  explanation: string;
  reasons: string[];
  matched_at: string;
  contract: {
    id: string; title: string; url: string | null;
    state: string | null; agency: string | null;
    naics_code: string | null; deadline: string | null;
    posted_date: string | null;
    value_min: number | null; value_max: number | null;
    set_aside: string | null;
  };
}

interface ContractDisplay {
  id: string; title: string; agency: string; naics: string;
  state: string; value: string; posted: string; deadline: string; score: number;
  type: string; matchedBy: "naics" | "keyword"; matchLabel: string;
  url: string | null;
  rawPosted: string | null;
  rawMatchedAt: string | null;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function formatValue(min: number | null, max: number | null): string {
  if (!min && !max) return "Value TBD";
  if (min && max && min !== max) return `${fmt$(min)} – ${fmt$(max)}`;
  return fmt$(min || max || 0);
}
function formatPosted(d: string | null): string {
  if (!d) return "Recently";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatDeadline(d: string | null): string {
  if (!d) return "TBD";
  const ms = new Date(d).getTime() - Date.now();
  const days = Math.floor(ms / 86400000);
  if (days < 0) return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 14) return `Due in ${days} days`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function mapMatch(m: EngineMatch): ContractDisplay {
  const reasons     = m.reasons || [];
  const naicsReason = reasons.find((r: string) => r.startsWith("naics:"));
  const kwReason    = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy   = naicsReason ? "naics" : "keyword";
  const matchLabel  = naicsReason
    ? `NAICS ${naicsReason.replace("naics:", "")}`
    : kwReason
      ? `Keyword: ${kwReason.replace("keyword:", "")}`
      : "Keyword match";
  return {
    id:         m.match_id,
    title:      m.contract.title || "Untitled Contract",
    agency:     m.contract.agency || "Federal Agency",
    naics:      m.contract.naics_code || "",
    state:      m.contract.state || "Federal",
    value:      formatValue(m.contract.value_min, m.contract.value_max),
    posted:     formatPosted(m.contract.posted_date),
    deadline:   formatDeadline(m.contract.deadline),
    score:      m.score,
    type:       m.contract.set_aside || "Full & Open",
    matchedBy, matchLabel,
    url:        m.contract.url || null,
    rawPosted:  m.contract.posted_date || null,
    rawMatchedAt: m.matched_at || null,
  };
}

/* ─── Mock fallback contracts (sample data, shown pre-scan) ─────── */

/* ─── Components ──────────────────────────────────────────────────── */
function MatchScore({ score }: { score: number }) {
  const color  = score >= 90 ? "#4ADE80" : score >= 75 ? "#C9A84C" : "#94A3B8";
  const bg     = score >= 90 ? "#1E2A1E" : score >= 75 ? "#2A2318" : "#1E2233";
  const border = score >= 90 ? "#2D5A2D" : score >= 75 ? "#4A3D1E" : "#2D3348";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"3px 9px", background:bg, border:`1px solid ${border}`, borderRadius:"999px", fontSize:"0.75rem", fontWeight:700, color, fontFamily:"var(--font-geist-mono, monospace)", whiteSpace:"nowrap" }}>
      {score}%
    </span>
  );
}

function MatchedBadge({ by, label }: { by: string; label: string }) {
  const isKeyword = by === "keyword";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"2px 8px", background:isKeyword ? "#1A1E2A" : "#1E211A", border:`1px solid ${isKeyword ? "#2D3A5A" : "#2A3020"}`, borderRadius:"4px", fontSize:"0.72rem", color:isKeyword ? "#93C5FD" : "#86EFAC", whiteSpace:"nowrap" }}>
      {isKeyword ? <Tag size={10} /> : <FileText size={10} />}
      {label}
    </span>
  );
}

function ContractCard({ c }: { c: ContractDisplay }) {
  return (
    <div className="contract-card-row" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"1.125rem 1.5rem", borderBottom:"1px solid #252320", gap:"1rem", transition:"background 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#27251F")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px", flexWrap:"wrap" }}>
          <MatchScore score={c.score} />
          <MatchedBadge by={c.matchedBy} label={c.matchLabel} />
          <span style={{ fontSize:"0.72rem", color:"#6B6560" }}>{c.type}</span>
        </div>
        <p style={{ fontWeight:600, fontSize:"0.9375rem", color:"#F7F5F0", margin:"0 0 4px", lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"500px" }}>{c.title}</p>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
          <span style={{ fontSize:"0.78rem", color:"#6B6560", display:"flex", alignItems:"center", gap:"4px" }}><Shield size={11} color="#4B5563"/>{c.agency}</span>
          <span style={{ fontSize:"0.78rem", color:"#6B6560", display:"flex", alignItems:"center", gap:"4px" }}><MapPin size={11} color="#4B5563"/>{c.state}</span>
          <span style={{ fontSize:"0.78rem", color:"#6B6560" }}>{c.posted}</span>
          <span style={{ fontSize:"0.78rem", color: c.deadline.includes("Expired") ? "#F87171" : c.deadline.includes("Due today") || c.deadline.includes("Due tomorrow") ? "#FCD34D" : "#6B6560" }}>{c.deadline}</span>
        </div>
      </div>
      <div className="contract-card-right" style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px", flexShrink:0 }}>
        <span style={{ fontSize:"0.875rem", fontWeight:600, color:"#F7F5F0", fontFamily:"var(--font-geist-mono, monospace)" }}>{c.value}</span>
        {c.url ? (
          <a href={c.url} target="_blank" rel="noopener noreferrer"
            style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 12px", background:"none", border:"1px solid #3D3830", borderRadius:"7px", color:"#A8A29E", fontSize:"0.78125rem", cursor:"pointer", textDecoration:"none", transition:"border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#C9A84C"; (e.currentTarget as HTMLAnchorElement).style.color="#C9A84C"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor="#3D3830"; (e.currentTarget as HTMLAnchorElement).style.color="#A8A29E"; }}>
            View <ExternalLink size={11} />
          </a>
        ) : (
          <button style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 12px", background:"none", border:"1px solid #3D3830", borderRadius:"7px", color:"#A8A29E", fontSize:"0.78125rem", cursor:"pointer", transition:"border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#C9A84C"; e.currentTarget.style.color="#C9A84C"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#3D3830"; e.currentTarget.style.color="#A8A29E"; }}>
            View <ExternalLink size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background:accent ? "linear-gradient(135deg, #2A2318 0%, #252320 100%)" : "#252320", border:`1px solid ${accent ? "#C9A84C30" : "#2D2A26"}`, borderRadius:"14px", padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"0.65rem" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"0.72rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
        <div style={{ width:"28px", height:"28px", borderRadius:"7px", background:accent ? "#C9A84C18" : "#2A2724", display:"flex", alignItems:"center", justifyContent:"center", color:accent ? "#C9A84C" : "#6B6560" }}>
          {icon}
        </div>
      </div>
      <div>
        <p style={{ fontSize:"1.875rem", fontWeight:700, color:"#F7F5F0", margin:0, letterSpacing:"-0.04em", lineHeight:1 }}>{value}</p>
        {sub && <p style={{ fontSize:"0.75rem", color:"#6B6560", margin:"5px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Set-aside label map ─────────────────────────────────────────── */
const SET_ASIDE_LABELS: Record<string, string> = {
  "8a":"8(a)", "wosb":"WOSB", "sdvosb":"SDVOSB", "hubzone":"HUBZone", "vosb":"VOSB",
};

/* ─── Monitoring profile panel ────────────────────────────────────── */
function MonitoringPanel({ profile }: { profile: Profile }) {
  const naics     = profile.naics_codes           ?? [];
  const states    = profile.states                ?? [];
  const keywords  = profile.keywords              ?? [];
  const setAsides = profile.set_aside_preferences ?? [];
  const hasPlan   = profile.plan === "pro" || profile.plan === "premium" || profile.plan === "active" || profile.plan === "professional";
  const isEmpty   = naics.length === 0 && states.length === 0 && keywords.length === 0;

  return (
    <div style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", overflow:"hidden" }}>
      <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid #2D2A26", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontWeight:700, fontSize:"0.9rem", color:"#F7F5F0", margin:0 }}>Monitoring Profile</p>
          <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"2px 0 0" }}>What the engine tracks for you</p>
        </div>
        <Link href="/dashboard/profile" title="Edit monitoring profile"
          style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"0.75rem", color:"#6B6560", textDecoration:"none", padding:"4px 8px", border:"1px solid #2D2A26", borderRadius:"6px", transition:"color 0.15s, border-color 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color="#C9A84C"; (e.currentTarget as HTMLAnchorElement).style.borderColor="#C9A84C50"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color="#6B6560"; (e.currentTarget as HTMLAnchorElement).style.borderColor="#2D2A26"; }}>
          <PenLine size={11} /> Edit
        </Link>
      </div>

      <div style={{ padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
        {isEmpty ? (
          <p style={{ fontSize:"0.8125rem", color:"#6B6560", textAlign:"center", padding:"0.5rem 0" }}>
            No profile set up yet.{" "}
            <Link href="/dashboard/onboarding" style={{ color:"#C9A84C", textDecoration:"none", fontWeight:600 }}>Configure →</Link>
          </p>
        ) : (
          <>
            {naics.length > 0 && (
              <div>
                <p style={{ fontSize:"0.7rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 0.5rem", display:"flex", alignItems:"center", gap:"5px" }}>
                  <FileText size={11} /> NAICS Codes
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                  {naics.map(code => (
                    <span key={code} style={{ fontSize:"0.75rem", fontFamily:"var(--font-geist-mono, monospace)", padding:"3px 9px", background:"#1E211A", border:"1px solid #2A3020", borderRadius:"5px", color:"#86EFAC" }}>
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {states.length > 0 && (
              <div>
                <p style={{ fontSize:"0.7rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 0.5rem", display:"flex", alignItems:"center", gap:"5px" }}>
                  <MapPin size={11} /> States
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                  {states.map(s => (
                    <span key={s} style={{ fontSize:"0.75rem", padding:"3px 9px", background:"#1E1E2A", border:"1px solid #2D2D4A", borderRadius:"5px", color:"#93C5FD" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p style={{ fontSize:"0.7rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 0.5rem", display:"flex", alignItems:"center", gap:"5px" }}>
                <Tag size={11} /> Keywords
              </p>
              {keywords.length > 0 ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                  {keywords.map(kw => (
                    <span key={kw} style={{ fontSize:"0.75rem", padding:"3px 9px", background:"#1E1A2A", border:"1px solid #3A2D4A", borderRadius:"5px", color:"#C4B5FD" }}>
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize:"0.78rem", color:"#6B6560", margin:0 }}>
                  No keywords added.{" "}
                  <Link href="/dashboard/profile" style={{ color:"#C9A84C", textDecoration:"none", fontWeight:600 }}>Add keywords →</Link>{" "}
                  to catch contracts the engine might miss by NAICS alone.
                </p>
              )}
            </div>
            {setAsides.length > 0 && (
              <div>
                <p style={{ fontSize:"0.7rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 0.5rem", display:"flex", alignItems:"center", gap:"5px" }}>
                  <Shield size={11} /> Set-Aside Filters
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                  {setAsides.map(sa => (
                    <span key={sa} style={{ fontSize:"0.75rem", padding:"3px 9px", background:"#1E1A12", border:"1px solid #3A3020", borderRadius:"5px", color:"#FCD34D" }}>
                      {SET_ASIDE_LABELS[sa.toLowerCase()] ?? sa.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ padding:"0.75rem 1.25rem", borderTop:"1px solid #2D2A26", display:"flex", alignItems:"center", gap:"7px" }}>
        <RefreshCw size={11} color="#4ADE80" />
        <span style={{ fontSize:"0.72rem", color:"#6B6560" }}>
          Engine syncs daily at <strong style={{ color:"#A8A29E" }}>6:00 AM EST</strong>
        </span>
      </div>
    </div>
  );
}

/* ─── Feed skeleton loader ────────────────────────────────────────── */
function FeedSkeleton() {
  return (
    <>
      {[1,2,3].map(i => (
        <div key={i} style={{ padding:"1.125rem 1.5rem", borderBottom:"1px solid #252320" }}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <div style={{ width:42, height:20, background:"#2A2724", borderRadius:999, animation:"pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width:100, height:20, background:"#2A2724", borderRadius:4, animation:"pulse 1.5s ease-in-out infinite" }} />
          </div>
          <div style={{ width:"70%", height:16, background:"#2A2724", borderRadius:4, marginBottom:8, animation:"pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width:"50%", height:13, background:"#252320", borderRadius:4, animation:"pulse 1.5s ease-in-out infinite" }} />
        </div>
      ))}
    </>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [matches,        setMatches]        = useState<ContractDisplay[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchTotal,     setMatchTotal]     = useState(0);
  const [matchError,     setMatchError]     = useState(false);

  /* ── Fetch real matches from engine via server-side proxy ──────── */
  async function fetchMatches() {
    try {
      // Same-origin proxy — no CORS, no NEXT_PUBLIC env needed (fetch 50 for the chart)
      const res = await fetch('/api/user-matches?per_page=50');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const mapped = (json.matches || []).map(mapMatch);
      setMatches(mapped);
      setMatchTotal(json.pagination?.total || 0);
    } catch {
      setMatchError(true);
    } finally {
      setMatchesLoading(false);
    }
  }

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, company_name, plan, trial_ends_at, onboarding_complete, naics_codes, states, keywords, set_aside_preferences")
        .eq("id", userId)
        .single();
      setProfile(data);
      setLoading(false);
      // Start fetching real matches after profile loads
      setMatchesLoading(true);
      fetchMatches();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.replace("/auth/login");
          return;
        }
        if (session) loadProfile(session.user.id);
      }
    );

    const fallback = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
      } else if (loading) {
        loadProfile(session.user.id);
      }
    }, 800);

    return () => { subscription.unsubscribe(); clearTimeout(fallback); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#1C1917", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:"32px", height:"32px", border:"2px solid #C9A84C", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const emailSlug   = profile?.email?.split("@")[0] ?? "";
  const slugIsClean = emailSlug.length > 0 && !/\d{3,}/.test(emailSlug) && !/^\d/.test(emailSlug);
  const displayName = profile?.company_name || (slugIsClean ? emailSlug : "there");
  const naicsCount  = profile?.naics_codes?.length  ?? 0;
  const stateCount  = profile?.states?.length       ?? 0;
  const keywordCount= profile?.keywords?.length     ?? 0;
  const setupDone   = naicsCount > 0;
  const daysLeft    = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;
  const isTrial    = !profile?.plan || profile.plan === "trial";
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const subtitle = setupDone
    ? `Monitoring ${stateCount} state${stateCount !== 1 ? "s" : ""} · ${naicsCount} NAICS code${naicsCount !== 1 ? "s" : ""}${keywordCount > 0 ? ` · ${keywordCount} keyword${keywordCount !== 1 ? "s" : ""}` : ""} · Next digest: 6 AM EST`
    : "Complete your setup below to activate contract monitoring";

  const hasRealData      = matches.length > 0;
  const matchCountVal    = matchesLoading ? "…" : String(matchTotal);
  const newThisWeekVal   = matchesLoading ? "…" : String(matches.filter(m => m.posted === "Today" || m.posted === "Yesterday" || m.posted.includes("days ago")).length);

  /* ── Generate simple 14-day chart data ────────────────────────────── */
  const chartDays = 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chartData = Array.from({ length: chartDays }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (chartDays - 1 - i));
    return { date: d, count: 0 };
  });

  matches.forEach(m => {
    if (!m.rawPosted && !m.rawMatchedAt) return;
    const matchDate = new Date(m.rawPosted || m.rawMatchedAt!);
    matchDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - matchDate.getTime()) / 86400000);
    if (diff >= 0 && diff < chartDays) {
      chartData[chartDays - 1 - diff].count++;
    }
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <>
      <style>{`
        .db-header   { border-bottom: 1px solid #252320; background: #1C1917; position: sticky; top: 0; z-index: 50; height: 60px; display: flex; align-items: center; padding: 0 2rem; gap: 1.5rem; }
        .db-nav      { display: flex; align-items: center; gap: 0.25rem; flex: 1; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .db-nav::-webkit-scrollbar { display: none; }
        .db-nav-link { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: 0.8125rem; color: #6B6560; text-decoration: none; white-space: nowrap; transition: color 0.15s, background 0.15s; }
        .db-nav-link.active { color: #C9A84C !important; background: #2A2318 !important; }
        .db-actions  { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
        .db-main     { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }
        .db-2col     { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; align-items: start; }
        .db-signout-label { display: inline; }
        
        /* Bar chart animations and styles */
        .analytics-bar-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; transition: opacity 0.2s; position: relative; }
        .analytics-bar { width: 100%; max-width: 16px; background: #2D2A26; border-radius: 3px 3px 0 0; transition: background 0.2s, height 0.6s cubic-bezier(0.16, 1, 0.3, 1); min-height: 4px; }
        .analytics-bar-wrapper:hover .analytics-bar { background: #C9A84C; }
        .analytics-tooltip { opacity: 0; pointer-events: none; position: absolute; bottom: calc(100% + 4px); background: #252320; border: 1px solid #3D3830; color: #F7F5F0; font-size: 0.7rem; padding: 3px 8px; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); white-space: nowrap; transition: opacity 0.2s; z-index: 10; font-family: var(--font-geist-mono, monospace); }
        .analytics-bar-wrapper:hover .analytics-tooltip { opacity: 1; }

        @media (max-width: 768px) {
          .db-header  { padding: 0 1rem; gap: 0.75rem; }
          .db-main    { padding: 1.5rem 1rem; }
          .db-2col    { grid-template-columns: 1fr; }
          .db-signout-label { display: none; }
          .contract-card-row { flex-direction: column; align-items: stretch !important; gap: 0.75rem !important; }
          .contract-card-right { flex-direction: row !important; align-items: center !important; justify-content: space-between; width: 100%; border-top: 1px solid #2D2A26; padding-top: 0.75rem; }
        }
        @media (max-width: 480px) { .db-main { padding: 1rem 0.75rem; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#1C1917", fontFamily:"var(--font-inter), sans-serif" }}>

        <header className="db-header">
          <Link href="/" style={{ textDecoration:"none", flexShrink:0 }}>
            <span style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.05em" }}>
              <span style={{ color:"#C9A84C" }}>P</span><span style={{ color:"#F7F5F0" }}>lexovia</span>
            </span>
          </Link>
          <nav className="db-nav">
            {[
              { href:"/dashboard",                label:"Overview",  icon:<TrendingUp size={14} /> },
              { href:"/dashboard/contracts",       label:"Contracts", icon:<FileText size={14} /> },
              { href:"/dashboard/profile",         label:"Profile",   icon:<Settings size={14} /> },
              { href:"/dashboard/competitors",     label:"Competitors", icon:<Shield size={14} /> },
              { href:"/dashboard/team", label:"Team", icon:<Users size={14} /> },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className={`db-nav-link${pathname === href ? " active" : ""}`}
                onMouseEnter={e => { if (pathname !== href) { e.currentTarget.style.color="#F7F5F0"; e.currentTarget.style.background="#252320"; } }}
                onMouseLeave={e => { if (pathname !== href) { e.currentTarget.style.color="#6B6560"; e.currentTarget.style.background="transparent"; } }}>
                {icon}<span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="db-actions">
            <button onClick={signOut} style={{ display:"flex", alignItems:"center", gap:"6px", background:"none", border:"1px solid #2D2A26", borderRadius:"8px", padding:"6px 14px", color:"#6B6560", fontSize:"0.8125rem", cursor:"pointer", transition:"color 0.15s, border-color 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color="#F7F5F0"; e.currentTarget.style.borderColor="#3D3830"; }}
              onMouseLeave={e => { e.currentTarget.style.color="#6B6560"; e.currentTarget.style.borderColor="#2D2A26"; }}>
              <LogOut size={14} /> <span className="db-signout-label">Sign out</span>
            </button>
          </div>
        </header>

        <main className="db-main">

          {/* Greeting */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"2rem", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <h1 style={{ fontWeight:700, fontSize:"1.625rem", color:"#F7F5F0", margin:0, letterSpacing:"-0.03em" }}>
                {greeting}, {displayName}
              </h1>
              <p style={{ color:"#6B6560", fontSize:"0.875rem", margin:"0.375rem 0 0" }}>{subtitle}</p>
            </div>
            {isTrial && daysLeft !== null && (
              <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 16px", background:"#252320", border:"1px solid #C9A84C30", borderRadius:"10px" }}>
                <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#C9A84C", animation:"pulse 2s infinite", display:"block" }} />
                <span style={{ fontSize:"0.8125rem", color:"#C9A84C", fontWeight:600 }}>Free Trial</span>
                <span style={{ fontSize:"0.8125rem", color:"#6B6560" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</span>
              </div>
            )}
          </div>

          {/* Setup prompt */}
          {!setupDone && (
            <div style={{ background:"linear-gradient(135deg, #2A2318, #252320)", border:"1px solid #C9A84C33", borderRadius:"14px", padding:"1.375rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"2rem", gap:"1rem", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"#C9A84C22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Settings size={18} color="#C9A84C" />
                </div>
                <div>
                  <p style={{ fontWeight:600, fontSize:"0.9375rem", color:"#F7F5F0", margin:0 }}>Complete your monitoring profile</p>
                  <p style={{ fontSize:"0.8125rem", color:"#6B6560", margin:"3px 0 0" }}>Add NAICS codes, states, and keywords to start receiving matches</p>
                </div>
              </div>
              <Link href="/dashboard/profile" style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"10px 20px", background:"#C9A84C", color:"#1C1917", borderRadius:"9px", fontWeight:700, fontSize:"0.875rem", textDecoration:"none", whiteSpace:"nowrap" }}>
                Set up now <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {setupDone && (
            <div style={{ background:"#1A221A", border:"1px solid #2D4A2D", borderRadius:"12px", padding:"0.875rem 1.25rem", display:"flex", alignItems:"center", gap:"12px", marginBottom:"1.5rem" }}>
              <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#4ADE80", animation:"pulse 2s infinite", flexShrink:0, display:"block" }} />
              <p style={{ fontSize:"0.875rem", color:"#4ADE80", fontWeight:600, margin:0 }}>Monitoring is active</p>
              <span style={{ width:"1px", height:"14px", background:"#2D4A2D" }} />
              <p style={{ fontSize:"0.8125rem", color:"#6B6560", margin:0 }}>
                Government portals are scanned nightly. Your <strong style={{ color:"#A8A29E" }}>next match digest arrives at 6:00 AM EST</strong>.
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:"1rem", marginBottom:"2rem" }}>
            <StatCard icon={<FileText size={14} />}   label="Contract Matches" value={matchCountVal}  sub={hasRealData ? `${matchTotal} total matches found` : "Pending scan"} />
            <StatCard icon={<TrendingUp size={14} />} label="New This Week"    value={newThisWeekVal} sub={hasRealData ? "From last 7 days" : "Pending scan"} />
            <StatCard icon={<MapPin size={14} />}     label="States Active"    value={stateCount > 0 ? String(stateCount) : "—"} sub={stateCount > 0 ? `Monitoring ${stateCount} state${stateCount !== 1 ? "s" : ""}` : "Not configured"} />
            <StatCard icon={<Zap size={14} />}        label="NAICS Codes"      value={naicsCount > 0 ? String(naicsCount) : "—"} sub={naicsCount > 0 ? `of unlimited slots used` : "Not configured"} accent />
            <StatCard icon={<Tag size={14} />}        label="Keywords"         value={keywordCount > 0 ? String(keywordCount) : "—"} sub={keywordCount > 0 ? "Active keyword matching" : "None added yet"} />
          </div>

          {/* 2-col: feed + monitoring panel */}
          <div className="db-2col">

            {/* Contract feed */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
              
              {/* Analytics Timeline Chart */}
              <div style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", padding:"1.25rem 1.5rem" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" }}>
                   <div>
                     <h2 style={{ fontWeight:700, fontSize:"0.875rem", color:"#F7F5F0", margin:0, textTransform:"uppercase", letterSpacing:"0.05em" }}>Match Volume</h2>
                     <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"3px 0 0" }}>Daily breakdown over the last {chartDays} days</p>
                   </div>
                   <div style={{ fontWeight:700, fontSize:"1.25rem", color:"#C9A84C", letterSpacing:"-0.03em" }}>
                     +{hasRealData ? chartData.reduce((acc, curr) => acc + curr.count, 0) : 0}
                   </div>
                </div>
                
                <div style={{ height:"90px", display:"flex", alignItems:"flex-end", gap:"4px", paddingBottom:"10px", borderBottom:"1px dashed #3D3830" }}>
                  {hasRealData ? chartData.map((d, i) => {
                    const heightPercent = maxCount === 0 ? 0 : Math.max((d.count / maxCount) * 100, 4);
                    return (
                      <div key={i} className="analytics-bar-wrapper">
                        <div className="analytics-tooltip">
                          {d.count} match{d.count !== 1 && "es"}<br/>
                          <span style={{ color:"#A8A29E" }}>{d.date.toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>
                        </div>
                        <div className="analytics-bar" style={{ height: `${heightPercent}%`, background: d.count > 0 ? (i === chartDays - 1 ? "#C9A84C" : "#F7F5F0") : "#2D2A26" }} />
                      </div>
                    );
                  }) : chartData.map((_, i) => (
                    <div key={i} className="analytics-bar-wrapper">
                      <div className="analytics-bar" style={{ height: "4px" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"10px", fontSize:"0.65rem", color:"#6B6560", textTransform:"uppercase", fontWeight:600 }}>
                   <span>{chartData[0].date.toLocaleDateString("en-US", { month:"short", day:"numeric" })}</span>
                   <span>Today</span>
                </div>
              </div>

              <div style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", overflow:"hidden" }}>
                <div style={{ padding:"1.125rem 1.5rem", borderBottom:"1px solid #2D2A26", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <h2 style={{ fontWeight:700, fontSize:"0.9375rem", color:"#F7F5F0", margin:0 }}>Recent Contract Matches</h2>
                    <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"3px 0 0" }}>
                      Ranked by AI match score · Showing latest 10
                    </p>
                  </div>
                  {hasRealData && (
                    <Link href="/dashboard/contracts" style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"0.8125rem", color:"#C9A84C", textDecoration:"none", fontWeight:600 }}>
                      View all <ArrowUpRight size={13} />
                    </Link>
                  )}
                </div>

                {/* Engine error banner */}
                {matchError && (
                  <div style={{ padding:"10px 1.5rem", background:"#1A1515", borderBottom:"1px solid #2D2A26", display:"flex", alignItems:"center", gap:"8px" }}>
                    <AlertCircle size={14} color="#F87171" />
                    <span style={{ fontSize:"0.82rem", color:"#F87171" }}>Could not load contracts right now. Please try again later.</span>
                  </div>
                )}

                {/* Skeleton or real/mock data */}
                {matchesLoading ? (
                  <FeedSkeleton />
                ) : matches.length > 0 ? (
                  matches.slice(0, 10).map(c => <ContractCard key={c.id} c={c} />)
                ) : (
                  <div style={{ padding:"3rem 1.5rem", textAlign:"center" }}>
                     <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#2A2318", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                       <FileText size={20} color="#C9A84C" />
                     </div>
                     <p style={{ fontWeight: 600, color: "#F7F5F0", margin: "0 0 0.25rem" }}>No matches found</p>
                     <p style={{ fontSize: "0.8125rem", color: "#6B6560", maxWidth: "250px", margin: "0 auto" }}>
                       {setupDone ? "We haven't found any contracts matching your profile yet. We will scan again tonight." : "Complete your monitoring profile to discover relevant contracts."}
                     </p>
                  </div>
                )}
              </div>
            </div>

            {/* Monitoring panel */}
            <MonitoringPanel profile={profile!} />
          </div>

        </main>
      </div>
    </>
  );
}
