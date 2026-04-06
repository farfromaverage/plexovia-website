"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp, Shield, DollarSign, Award, Lock,
  AlertCircle, Zap, RefreshCw, ChevronRight,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────── */
interface Competitor {
  company_name: string;
  total_awards: number;
  total_value: number;
  naics_codes: string[];
  latest_award: string | null;
  win_rate?: number;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
function fmt$(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Competitor row ──────────────────────────────────────────────── */
function CompetitorRow({ c, rank }: { c: Competitor; rank: number }) {
  return (
    <div className="cmp-row" style={{ alignItems:"center", gap:"0.75rem", padding:"1rem 1.5rem", borderBottom:"1px solid #252320", transition:"background 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#27251F")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Rank */}
      <span style={{ fontSize:"0.9rem", fontWeight:700, color: rank <= 3 ? "#C9A84C" : "#4A4540", fontFamily:"var(--font-geist-mono, monospace)", textAlign:"center" }}>
        #{rank}
      </span>
      {/* Company */}
      <div>
        <p style={{ fontWeight:600, fontSize:"0.9rem", color:"#F7F5F0", margin:"0 0 3px" }}>{c.company_name}</p>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {c.naics_codes.slice(0, 3).map(n => (
            <span key={n} style={{ fontSize:"0.68rem", padding:"1px 6px", background:"#1E211A", border:"1px solid #2A3020", borderRadius:4, color:"#86EFAC", fontFamily:"var(--font-geist-mono, monospace)" }}>{n}</span>
          ))}
          {c.naics_codes.length > 3 && (
            <span style={{ fontSize:"0.68rem", color:"#4A4540" }}>+{c.naics_codes.length - 3}</span>
          )}
        </div>
      </div>
      {/* Awards */}
      <div className="cmp-stat-box" style={{ textAlign:"right" }}>
        <p style={{ fontSize:"0.875rem", fontWeight:600, color:"#F7F5F0", margin:0, fontFamily:"var(--font-geist-mono, monospace)" }}>{c.total_awards}</p>
        <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"2px 0 0" }}>contracts won</p>
      </div>
      {/* Total value */}
      <div className="cmp-stat-box" style={{ textAlign:"right" }}>
        <p style={{ fontSize:"0.875rem", fontWeight:600, color:"#C9A84C", margin:0, fontFamily:"var(--font-geist-mono, monospace)" }}>{fmt$(c.total_value)}</p>
        <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"2px 0 0" }}>awarded</p>
      </div>
      {/* Latest award */}
      <div className="cmp-stat-box" style={{ textAlign:"right" }}>
        <p style={{ fontSize:"0.78rem", color:"#A8A29E", margin:0 }}>{fmtDate(c.latest_award)}</p>
        <p style={{ fontSize:"0.72rem", color:"#6B6560", margin:"2px 0 0" }}>latest win</p>
      </div>
    </div>
  );
}



/* ─── Page ────────────────────────────────────────────────────────── */
export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [plan,        setPlan]        = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [naicsCodes,  setNaicsCodes]  = useState<string[]>([]);
  const [days,        setDays]        = useState(90);
  const [total,       setTotal]       = useState(0);

  // Load plan first
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("profiles").select("plan, naics_codes").eq("id", session.user.id).single()
        .then(({ data }) => {
          setPlan(data?.plan ?? "trial");
          setNaicsCodes(data?.naics_codes ?? []);
        });
    });
  }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/user-competitors?days=${days}&limit=25`);
      if (res.status === 400) {
        setCompetitors([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCompetitors(json.competitors || []);
      setTotal(json.total_competitors || 0);
    } catch {
      setError("fetch_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (plan === null) return;      // wait for plan to load
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, days]);

  return (
    <>
      <style>{`
        .cc-header { border-bottom:1px solid #252320; background:#1C1917; position:sticky; top:0; z-index:50; height:60px; display:flex; align-items:center; padding:0 2rem; gap:1.5rem; }
        .cc-nav    { display:flex; gap:0.25rem; flex:1; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
        .cc-nav::-webkit-scrollbar { display:none; }
        .cc-nav-item { white-space:nowrap; }
        .cc-main   { max-width:1100px; margin:0 auto; padding:2rem; }
        
        .cmp-head { display:grid; grid-template-columns:40px 1fr 120px 120px 140px; padding:0.625rem 1.5rem; border-bottom:1px solid #2D2A26; }
        .cmp-row  { display:grid; grid-template-columns:40px 1fr 120px 120px 140px; }

        @media (max-width: 768px) {
          .cc-header { padding: 0 1rem; }
          .cc-main   { padding: 1rem; }
          .cmp-head  { display: none; }
          .cmp-row { display: flex; flex-direction: column; align-items: flex-start !important; gap: 0.75rem !important; }
          .cmp-stat-box { display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid #252320; padding-top: 0.5rem; text-align: left !important; }
          .cmp-stat-box > p:last-child { margin-top: 0 !important; text-align: right; }
          .cmp-stat-box > p:first-child { text-align: left; }
        }

        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#1C1917", fontFamily:"var(--font-inter), sans-serif" }}>

        <header className="cc-header">
          <Link href="/" style={{ textDecoration:"none", flexShrink:0 }}>
            <span style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.05em" }}>
              <span style={{ color:"#C9A84C" }}>P</span><span style={{ color:"#F7F5F0" }}>lexovia</span>
            </span>
          </Link>
          <nav className="cc-nav">
            {[
              { href:"/dashboard", label:"Overview" },
              { href:"/dashboard/contracts", label:"Contracts" },
              { href:"/dashboard/profile", label:"Profile" },
              { href:"/dashboard/competitors", label:"Competitors", active:true },
              { href:"/dashboard/team", label:"Team" },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className="cc-nav-item"
                style={{ padding:"6px 12px", borderRadius:"8px", fontSize:"0.8125rem", textDecoration:"none",
                  color: n.active ? "#C9A84C" : "#6B6560",
                  background: n.active ? "#2A2318" : "transparent" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="cc-main">

          <>
              {/* Title + controls */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:"1rem" }}>
                <div>
                  <h1 style={{ fontWeight:700, fontSize:"1.5rem", color:"#F7F5F0", margin:0, letterSpacing:"-0.03em" }}>
                    Competitor Tracking
                  </h1>
                  <p style={{ fontSize:"0.875rem", color:"#6B6560", margin:"4px 0 0" }}>
                    Companies winning contracts in your NAICS codes
                    {naicsCodes.length > 0 && ` (${naicsCodes.join(", ")})`}
                  </p>
                </div>
                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                  <span style={{ fontSize:"0.78rem", color:"#6B6560" }}>Period:</span>
                  {[30, 90, 180, 365].map(d => (
                    <button key={d} onClick={() => setDays(d)}
                      style={{ padding:"5px 10px", borderRadius:"6px", fontSize:"0.75rem", cursor:"pointer", border:"1px solid",
                        background: days === d ? "#2A2318" : "none",
                        borderColor: days === d ? "#C9A84C50" : "#2D2A26",
                        color: days === d ? "#C9A84C" : "#6B6560" }}>
                      {d}d
                    </button>
                  ))}
                  <button onClick={load} style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 10px", background:"none", border:"1px solid #2D2A26", borderRadius:"7px", color:"#6B6560", fontSize:"0.8125rem", cursor:"pointer" }}>
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {/* Summary stats */}
              {!loading && !error && competitors.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:"1rem", marginBottom:"1.5rem" }}>
                  {[
                    { icon:<Award size={14}/>,      label:"Companies tracked", value:String(total) },
                    { icon:<TrendingUp size={14}/>,  label:"Total contracts won", value:String(competitors.reduce((s, c) => s + c.total_awards, 0)) },
                    { icon:<DollarSign size={14}/>,  label:"Total value awarded", value:fmt$(competitors.reduce((s, c) => s + c.total_value, 0)) },
                    { icon:<Shield size={14}/>,      label:"NAICS codes tracked", value:String(naicsCodes.length) },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"12px", padding:"1rem 1.25rem" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:"0.68rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
                        <span style={{ color:"#4A4540" }}>{icon}</span>
                      </div>
                      <p style={{ fontSize:"1.5rem", fontWeight:700, color:"#F7F5F0", margin:0, letterSpacing:"-0.03em" }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              <div style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", overflow:"hidden" }}>
                <div className="cmp-head">
                  {["#","Company","Contracts","Total Value","Latest Win"].map(h => (
                    <span key={h} style={{ fontSize:"0.68rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
                  ))}
                </div>

                {loading ? (
                  <>{[1,2,3,4,5].map(i => (
                    <div key={i} className="cmp-row" style={{ padding:"1rem 1.5rem", borderBottom:"1px solid #252320", gap:"0.75rem" }}>
                      {[1,2,3,4,5].map(j => <div key={j} style={{ height:14, background:"#2A2724", borderRadius:4, animation:"pulse 1.4s ease-in-out infinite" }} />)}
                    </div>
                  ))}</>
                ) : error === "fetch_failed" ? (
                  <div style={{ padding:"2.5rem", textAlign:"center" }}>
                    <AlertCircle size={24} color="#F87171" style={{ margin:"0 auto 0.75rem" }} />
                    <p style={{ color:"#F87171", fontSize:"0.875rem", margin:"0 0 0.5rem" }}>Could not load competitor data.</p>
                    <button onClick={load} style={{ fontSize:"0.8125rem", color:"#C9A84C", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Retry</button>
                  </div>
                ) : competitors.length === 0 ? (
                  <div style={{ padding:"3rem", textAlign:"center" }}>
                    <TrendingUp size={28} color="#4A4540" style={{ margin:"0 auto 1rem" }} />
                    <p style={{ color:"#6B6560", fontSize:"0.9375rem", margin:"0 0 6px", fontWeight:600 }}>No data yet</p>
                    <p style={{ fontSize:"0.8125rem", color:"#4A4540", margin:0 }}>
                      Competitor data populates as the engine tracks award history in your NAICS codes.
                      {naicsCodes.length === 0 && " Add NAICS codes to your profile first."}
                    </p>
                    {naicsCodes.length === 0 && (
                      <Link href="/dashboard/profile" style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:"1.25rem", padding:"8px 16px", background:"#C9A84C", color:"#1C1917", borderRadius:"8px", fontWeight:700, fontSize:"0.8125rem", textDecoration:"none" }}>
                        Add NAICS codes <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                ) : (
                  competitors.map((c, i) => <CompetitorRow key={c.company_name} c={c} rank={i + 1} />)
                )}
              </div>
            </>
        </main>
      </div>
    </>
  );
}
