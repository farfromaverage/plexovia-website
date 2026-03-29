"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FileText, MapPin, Shield, ExternalLink, Tag,
  ChevronLeft, ChevronRight, Filter, Search, RefreshCw,
  AlertCircle,
} from "lucide-react";



/* ─── Types ───────────────────────────────────────────────────────── */
interface ContractRow {
  id: string; title: string; agency: string; naics: string;
  state: string; value: string; posted: string; deadline: string;
  score: number; type: string; matchedBy: "naics" | "keyword";
  matchLabel: string; url: string | null;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtVal(min: number | null, max: number | null) {
  if (!min && !max) return "TBD";
  if (min && max && min !== max) return `${fmt$(min)} – ${fmt$(max)}`;
  return fmt$(min || max || 0);
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDeadline(d: string | null) {
  if (!d) return "—";
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(m: any): ContractRow {
  const c = m.contract || {};
  const reasons = m.reasons || [];
  const naicsR = reasons.find((r: string) => r.startsWith("naics:"));
  const kwR    = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy = naicsR ? "naics" : "keyword";
  const matchLabel = naicsR
    ? `NAICS ${naicsR.replace("naics:", "")}`
    : kwR ? `Keyword: ${kwR.replace("keyword:", "")}` : "Keyword match";
  return {
    id: m.match_id, title: c.title || "Untitled",
    agency: c.agency || "Federal Agency", naics: c.naics_code || "",
    state: c.state || "Federal",
    value: fmtVal(c.value_min, c.value_max),
    posted: fmtDate(c.posted_date),
    deadline: fmtDeadline(c.deadline),
    score: m.score, type: c.set_aside || "Full & Open",
    matchedBy, matchLabel, url: c.url || null,
  };
}

/* ─── Score pill ──────────────────────────────────────────────────── */
function ScorePill({ score }: { score: number }) {
  const c = score >= 90 ? "#4ADE80" : score >= 75 ? "#C9A84C" : "#94A3B8";
  const bg = score >= 90 ? "#1E2A1E" : score >= 75 ? "#2A2318" : "#1E2233";
  const bd = score >= 90 ? "#2D5A2D" : score >= 75 ? "#4A3D1E" : "#2D3348";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px", background:bg, border:`1px solid ${bd}`, borderRadius:999, fontSize:"0.72rem", fontWeight:700, color:c, fontFamily:"var(--font-geist-mono, monospace)" }}>
      {score}%
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [minScore,  setMinScore]  = useState(0);
  const [search,    setSearch]    = useState("");
  const [plan,      setPlan]      = useState<string | null>(null);
  const PER_PAGE = 15;

  // Load plan
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("profiles").select("plan").eq("id", session.user.id).single()
        .then(({ data }) => setPlan(data?.plan ?? "trial"));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await fetch(`/api/user-matches?page=${page}&per_page=${PER_PAGE}&min_score=${minScore}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setContracts((json.matches || []).map(mapRow));
      setTotal(json.pagination?.total || 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, minScore]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const filtered = search.trim()
    ? contracts.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.agency.toLowerCase().includes(search.toLowerCase()) ||
        c.naics.includes(search) ||
        c.state.toLowerCase().includes(search.toLowerCase())
      )
    : contracts;



  return (
    <>
      <style>{`
        .ct-header { border-bottom:1px solid #252320; background:#1C1917; position:sticky; top:0; z-index:50; height:60px; display:flex; align-items:center; padding:0 2rem; gap:1.5rem; }
        .ct-main   { max-width:1100px; margin:0 auto; padding:2rem; }
        .ct-row    { display:flex; align-items:flex-start; justify-content:space-between; padding:1.125rem 1.5rem; border-bottom:1px solid #252320; gap:1rem; transition:background 0.12s; cursor:default; }
        .ct-row:hover { background:#27251F; }
        @media (max-width:768px) { .ct-header { padding:0 1rem; } .ct-main { padding:1rem; } }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#1C1917", fontFamily:"var(--font-inter), sans-serif" }}>

        {/* Header */}
        <header className="ct-header">
          <Link href="/" style={{ textDecoration:"none", flexShrink:0 }}>
            <span style={{ fontWeight:800, fontSize:"1.2rem", letterSpacing:"-0.05em" }}>
              <span style={{ color:"#C9A84C" }}>P</span><span style={{ color:"#F7F5F0" }}>lexovia</span>
            </span>
          </Link>
          <nav style={{ display:"flex", gap:"0.25rem", flex:1 }}>
            {[
              { href:"/dashboard", label:"Overview" },
              { href:"/dashboard/contracts", label:"Contracts", active:true },
              { href:"/dashboard/profile", label:"Profile" },
              { href:"/dashboard/competitors", label:"Competitors" },
              { href:"/dashboard/team", label:"Team" },
            ].map(n => (
              <Link key={n.href} href={n.href}
                style={{ padding:"6px 12px", borderRadius:"8px", fontSize:"0.8125rem", textDecoration:"none",
                  color: n.active ? "#C9A84C" : "#6B6560",
                  background: n.active ? "#2A2318" : "transparent" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="ct-main">

          {/* Page title */}
          <div style={{ marginBottom:"1.5rem" }}>
            <h1 style={{ fontWeight:700, fontSize:"1.5rem", color:"#F7F5F0", margin:0, letterSpacing:"-0.03em" }}>
              Contract Matches
            </h1>
            <p style={{ fontSize:"0.875rem", color:"#6B6560", margin:"4px 0 0" }}>
              {total > 0 ? `${total} contracts matched your profile · Sorted by relevance score` : "Matches appear here after the engine's nightly scan"}
            </p>
          </div>

          {/* Filters row */}
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
            {/* Search */}
            <div style={{ position:"relative", flex:1, minWidth:"220px" }}>
              <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#6B6560", pointerEvents:"none" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search title, agency, NAICS, state…"
                style={{ width:"100%", padding:"7px 10px 7px 30px", background:"#252320", border:"1px solid #2D2A26", borderRadius:"8px", color:"#F7F5F0", fontSize:"0.8125rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
              />
            </div>

            {/* Score filter */}
            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <Filter size={12} color="#6B6560" />
              <span style={{ fontSize:"0.78rem", color:"#6B6560" }}>Min score:</span>
              {[0,50,75,90].map(s => (
                <button key={s} onClick={() => { setMinScore(s); setPage(1); }}
                  style={{ padding:"5px 10px", borderRadius:"6px", fontSize:"0.75rem", cursor:"pointer", border:"1px solid", fontWeight: minScore === s ? 700 : 400,
                    background: minScore === s ? "#2A2318" : "none",
                    borderColor: minScore === s ? "#C9A84C50" : "#2D2A26",
                    color: minScore === s ? "#C9A84C" : "#6B6560" }}>
                  {s === 0 ? "All" : `${s}+`}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={load} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", background:"none", border:"1px solid #2D2A26", borderRadius:"8px", color:"#6B6560", fontSize:"0.8125rem", cursor:"pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>



          {/* Contract table */}
          <div style={{ background:"#252320", border:"1px solid #2D2A26", borderRadius:"14px", overflow:"hidden" }}>
            {/* Table head */}
            <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 140px 80px 100px 80px", padding:"0.625rem 1.5rem", borderBottom:"1px solid #2D2A26" }}>
              {["Score","Contract","Agency","State","Value","Deadline"].map(h => (
                <span key={h} style={{ fontSize:"0.68rem", fontWeight:600, color:"#6B6560", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              <>{[1,2,3,4,5].map(i => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"80px 1fr 140px 80px 100px 80px", padding:"1rem 1.5rem", borderBottom:"1px solid #252320", gap:"1rem" }}>
                  {[1,2,3,4,5,6].map(j => <div key={j} style={{ height:14, background:"#2A2724", borderRadius:4, animation:"pulse 1.4s ease-in-out infinite" }} />)}
                </div>
              ))}</>
            ) : error ? (
              <div style={{ padding:"2.5rem", textAlign:"center" }}>
                <AlertCircle size={24} color="#F87171" style={{ margin:"0 auto 0.75rem" }} />
                <p style={{ color:"#F87171", fontSize:"0.875rem", margin:0 }}>Could not load matches. Engine may be starting up — try refreshing.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:"3rem", textAlign:"center" }}>
                <FileText size={28} color="#4A4540" style={{ margin:"0 auto 1rem" }} />
                <p style={{ color:"#6B6560", fontSize:"0.9375rem", margin:"0 0 6px", fontWeight:600 }}>
                  {total === 0 ? "No matches yet" : "No contracts match your search"}
                </p>
                <p style={{ fontSize:"0.8125rem", color:"#4A4540", margin:0 }}>
                  {total === 0
                    ? "The engine scans nightly. Set up your NAICS codes and check back tomorrow."
                    : "Try adjusting your search or lowering the score filter."}
                </p>
              </div>
            ) : (
              filtered.map(c => (
                <div key={c.id} className="ct-row"
                  style={{ display:"grid", gridTemplateColumns:"80px 1fr 140px 80px 100px 80px", alignItems:"center", gap:"0.75rem" }}>
                  {/* Score */}
                  <div><ScorePill score={c.score} /></div>
                  {/* Title + badges */}
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:"0.875rem", color:"#F7F5F0", margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:"0.68rem", padding:"1px 6px", background: c.matchedBy==="naics" ? "#1E211A" : "#1A1E2A", border:`1px solid ${c.matchedBy==="naics" ? "#2A3020" : "#2D3A5A"}`, borderRadius:4, color: c.matchedBy==="naics" ? "#86EFAC" : "#93C5FD", display:"flex", alignItems:"center", gap:3 }}>
                        {c.matchedBy === "naics" ? <FileText size={9}/> : <Tag size={9}/>}{c.matchLabel}
                      </span>
                      {c.type !== "Full & Open" && (
                        <span style={{ fontSize:"0.68rem", padding:"1px 6px", background:"#1E1A12", border:"1px solid #3A3020", borderRadius:4, color:"#FCD34D" }}>{c.type}</span>
                      )}
                    </div>
                  </div>
                  {/* Agency */}
                  <div style={{ fontSize:"0.78rem", color:"#8A8580", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
                    <Shield size={10} color="#4B5563" style={{ flexShrink:0 }} />{c.agency}
                  </div>
                  {/* State */}
                  <div style={{ fontSize:"0.78rem", color:"#8A8580", display:"flex", alignItems:"center", gap:4 }}>
                    <MapPin size={10} color="#4B5563" />{c.state}
                  </div>
                  {/* Value */}
                  <div style={{ fontSize:"0.8125rem", fontWeight:600, color:"#F7F5F0", fontFamily:"var(--font-geist-mono, monospace)", whiteSpace:"nowrap" }}>{c.value}</div>
                  {/* Deadline + View */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    <span style={{ fontSize:"0.72rem", color: c.deadline === "Expired" ? "#F87171" : c.deadline.includes("days") && parseInt(c.deadline) < 7 ? "#FBBF24" : "#6B6560" }}>{c.deadline}</span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer"
                        style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:"0.72rem", color:"#C9A84C", textDecoration:"none" }}>
                        SAM.gov <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"1rem" }}>
              <span style={{ fontSize:"0.8125rem", color:"#6B6560" }}>
                Page {page} of {totalPages} · {total} total
              </span>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background:"none", border:"1px solid #2D2A26", borderRadius:"7px", color: page === 1 ? "#3D3830" : "#A8A29E", cursor: page === 1 ? "not-allowed" : "pointer", fontSize:"0.8125rem" }}>
                  <ChevronLeft size={13} /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background:"none", border:"1px solid #2D2A26", borderRadius:"7px", color: page === totalPages ? "#3D3830" : "#A8A29E", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize:"0.8125rem" }}>
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
