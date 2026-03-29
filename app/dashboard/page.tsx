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
  state: string; value: string; posted: string; score: number;
  type: string; matchedBy: "naics" | "keyword"; matchLabel: string;
  url: string | null;
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
function mapMatch(m: EngineMatch): ContractDisplay {
  const reasons     = m.reasons || [];
  const naicsReason = reasons.find(r => r.startsWith("naics:"));
  const kwReason    = reasons.find(r => r.startsWith("keyword:"));
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
    score:      m.score,
    type:       m.contract.set_aside || "Full & Open",
    matchedBy, matchLabel,
    url:        m.contract.url || null,
  };
}

/* ─── Mock fallback contracts (sample data, shown pre-scan) ─────── */
const MOCK_CONTRACTS: ContractDisplay[] = [
  { id:"1", title:"IT Modernization & Cloud Migration Services",        agency:"Dept. of Defense",              naics:"541512", state:"VA", value:"$2.1M – $5M",     posted:"Today",       score:96, type:"Full & Open",            matchedBy:"naics",   matchLabel:"NAICS 541512",          url:null },
  { id:"2", title:"Cybersecurity Operations Center (SOC) Support",     agency:"Dept. of Homeland Security",    naics:"541519", state:"MD", value:"$800K – $2M",    posted:"Yesterday",   score:89, type:"Small Business Set-Aside", matchedBy:"keyword", matchLabel:"Keyword: cybersecurity",url:null },
  { id:"3", title:"Enterprise Software Development & Integration",     agency:"Dept. of Veterans Affairs",     naics:"541511", state:"TX", value:"$500K – $1.5M",  posted:"2 days ago",  score:82, type:"SDVOSB Set-Aside",        matchedBy:"naics",   matchLabel:"NAICS 541511",          url:null },
  { id:"4", title:"Cloud Infrastructure & DevOps Modernization",       agency:"General Services Administration",naics:"518210", state:"DC", value:"$1.2M – $3M",    posted:"3 days ago",  score:74, type:"Full & Open",            matchedBy:"keyword", matchLabel:"Keyword: cloud",        url:null },
  { id:"5", title:"Network Security Assessment & Penetration Testing", agency:"Dept. of Energy",               naics:"541519", state:"CO", value:"$300K – $900K",  posted:"4 days ago",  score:68, type:"8(a) Set-Aside",          matchedBy:"keyword", matchLabel:"Keyword: security",    url:null },
];

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
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"1.125rem 1.5rem", borderBottom:"1px solid #252320", gap:"1rem", transition:"background 0.12s" }}
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
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px", flexShrink:0 }}>
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
  const [hasRealData,    setHasRealData]    = useState(false);

  /* ── Fetch real matches from engine via server-side proxy ──────── */
  async function fetchMatches() {
    try {
      // Same-origin proxy — no CORS, no NEXT_PUBLIC env needed
      const res = await fetch('/api/user-matches?per_page=10');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const mapped = (json.matches || []).map(mapMatch);
      setMatches(mapped);
      setMatchTotal(json.pagination?.total || 0);
      setHasRealData(mapped.length > 0);
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
  const hasPlan     = profile?.plan === "pro" || profile?.plan === "premium" || profile?.plan === "active" || profile?.plan === "professional";
  const isPaid      = hasPlan;
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const subtitle = setupDone
    ? `Monitoring ${stateCount} state${stateCount !== 1 ? "s" : ""} · ${naicsCount} NAICS code${naicsCount !== 1 ? "s" : ""}${keywordCount > 0 ? ` · ${keywordCount} keyword${keywordCount !== 1 ? "s" : ""}` : ""} · Next digest: 6 AM EST`
    : "Complete your setup below to activate contract monitoring";

  const displayContracts = hasRealData ? matches : MOCK_CONTRACTS;
  const matchCountVal    = matchesLoading ? "…" : hasRealData ? String(matchTotal) : "—";
  const newThisWeekVal   = matchesLoading ? "…" : hasRealData ? String(matches.filter(m => m.posted === "Today" || m.posted === "Yesterday" || m.posted.includes("days ago")).length) : "—";

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
        @media (max-width: 768px) {
          .db-header  { padding: 0 1rem; gap: 0.75rem; }
          .db-main    { padding: 1.5rem 1rem; }
          .db-2col    { grid-template-columns: 1fr; }
          .db-signout-label { display: none; }
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
            {!isPaid && (
              <Link href="/pricing" style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 14px", background:"#C9A84C22", border:"1px solid #C9A84C44", borderRadius:"8px", fontSize:"0.78125rem", fontWeight:600, color:"#C9A84C", textDecoration:"none", whiteSpace:"nowrap" }}>
                <Zap size={12} /> Upgrade
              </Link>
            )}
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
                Government portals are scanned nightly. Your <strong style={{ color:"#A8A29E" }}>first match digest arrives tomorrow at 6:00 AM EST</strong>.
              </p>
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:"1rem", marginBottom:"2rem" }}>
            <StatCard icon={<FileText size={14} />}   label="Contract Matches" value={matchCountVal}  sub={hasRealData ? `${matchTotal} total matches found` : setupDone ? "Pending first scan" : "Set up profile first"} />
            <StatCard icon={<TrendingUp size={14} />} label="New This Week"    value={newThisWeekVal} sub={hasRealData ? "From last 7 days" : setupDone ? "Check back after 6 AM" : "Set up profile first"} />
            <StatCard icon={<MapPin size={14} />}     label="States Active"    value={stateCount > 0 ? String(stateCount) : "—"} sub={stateCount > 0 ? `Monitoring ${stateCount} state${stateCount !== 1 ? "s" : ""}` : "Not configured"} />
            <StatCard icon={<Zap size={14} />}        label="NAICS Codes"      value={naicsCount > 0 ? String(naicsCount) : "—"} sub={naicsCount > 0 ? `of unlimited slots used` : "Not configured"} accent />
            <StatCard icon={<Tag size={14} />}        label="Keywords"         value={keywordCount > 0 ? String(keywordCount) : "—"} sub={keywordCount > 0 ? "Active keyword matching" : "None added yet"} />
          </div>

          {/* 2-col: feed + monitoring panel */}
          <div className="db-2col">

            {/* Contract feed */}
            <div style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", overflow:"hidden" }}>
              <div style={{ padding:"1.125rem 1.5rem", borderBottom:"1px solid #2D2A26", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <h2 style={{ fontWeight:700, fontSize:"0.9375rem", color:"#F7F5F0", margin:0 }}>Recent Contract Matches</h2>
                  <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"3px 0 0" }}>
                    {hasRealData ? `Ranked by AI match score · ${matchTotal} total matches` : "Ranked by AI match score · Matched via NAICS codes and keywords"}
                  </p>
                </div>
                <Link href="/dashboard/contracts" style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"0.8125rem", color:"#C9A84C", textDecoration:"none", fontWeight:600 }}>
                  View all <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Banner — only shown when no real data yet */}
              {!hasRealData && !matchesLoading && !matchError && (
                <div style={{ padding:"10px 1.5rem", background:"#1A1812", borderBottom:"1px solid #2D2A26", display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ padding:"2px 8px", background:"#3D3520", border:"1px solid #C9A84C40", borderRadius:"4px", fontSize:"0.68rem", color:"#C9A84C", fontWeight:700, fontFamily:"var(--font-geist-mono, monospace)", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>SAMPLE DATA</span>
                  <span style={{ fontSize:"0.8125rem", color:"#A8A29E" }}>
                    Example contracts shown until your first scan completes. Real matches arrive at{" "}
                    <strong style={{ color:"#F7F5F0" }}>6 AM tomorrow</strong>.
                  </span>
                </div>
              )}

              {/* Engine error banner */}
              {matchError && (
                <div style={{ padding:"10px 1.5rem", background:"#1A1515", borderBottom:"1px solid #2D2A26", display:"flex", alignItems:"center", gap:"8px" }}>
                  <AlertCircle size={14} color="#F87171" />
                  <span style={{ fontSize:"0.82rem", color:"#F87171" }}>Could not reach engine. Showing sample data.</span>
                </div>
              )}

              {/* Skeleton or real/mock data */}
              {matchesLoading
                ? <FeedSkeleton />
                : displayContracts.map(c => <ContractCard key={c.id} c={c} />)
              }
            </div>

            {/* Monitoring panel */}
            <MonitoringPanel profile={profile!} />
          </div>

          {/* Upgrade CTA */}
          {!hasPlan && (
            <div style={{ marginTop:"1.5rem", background:"linear-gradient(135deg, #1E1C1A 0%, #252320 100%)", border:"1px solid #2D2A26", borderRadius:"14px", padding:"1.375rem 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"#C9A84C18", border:"1px solid #C9A84C30", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Zap size={17} color="#C9A84C" />
                </div>
                <div>
                  <p style={{ fontWeight:700, fontSize:"0.9375rem", color:"#F7F5F0", margin:0 }}>
                    {daysLeft !== null ? `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}` : "Start your subscription today"}
                  </p>
                  <p style={{ fontSize:"0.8125rem", color:"#6B6560", margin:"4px 0 0" }}>
                    Activate your subscription to the Plexovia Intelligence system. $299/mo. Cancel anytime.
                  </p>
                </div>
              </div>
              <Link href="/pricing" style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"10px 22px", background:"#C9A84C", color:"#1C1917", borderRadius:"9px", fontWeight:700, fontSize:"0.875rem", textDecoration:"none", whiteSpace:"nowrap" }}>
                Subscribe Now <ChevronRight size={15} />
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
