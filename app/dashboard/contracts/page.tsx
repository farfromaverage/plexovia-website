"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  FileText, MapPin, Shield, ExternalLink, Tag, DollarSign,
  ChevronLeft, ChevronRight, Filter, Search, RefreshCw,
  ArrowUpDown, Download, Calendar,
} from "lucide-react";
import ScoreBadge from "../components/ScoreBadge";
import SkeletonRows from "../components/SkeletonRows";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

/* ─── Types ───────────────────────────────────────────────────────── */
interface ContractRow {
  id: string;
  title: string;
  agency: string;
  naics: string;
  psc: string;
  state: string;
  value: string;
  valueMin: number | null;
  valueMax: number | null;
  posted: string;
  postedRaw: string | null;
  deadline: string;
  deadlineRaw: string | null;
  deadlineDays: number | null;
  score: number;
  setAside: string;
  matchedBy: "naics" | "keyword";
  matchLabel: string;
  url: string | null;
  matchedAt: string | null;
}

type SortKey = "score" | "deadline" | "value_min" | "posted_date";

/* ─── Helpers ─────────────────────────────────────────────────────── */
function fmt$(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtVal(min: number | null, max: number | null) {
  if (!min && !max) return "TBD";
  if (min && max && min !== max) return `${fmt$(min)} – ${fmt$(max)}`;
  return fmt$(min || max || 0);
}
function fmtDate(d: string | null) {
  if (!d) return "N/A";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDeadline(d: string | null): { label: string; days: number | null } {
  if (!d) return { label: "TBD", days: null };
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", days };
  if (days === 0) return { label: "Due today", days: 0 };
  if (days === 1) return { label: "1 day left", days: 1 };
  return { label: `${days} days left`, days };
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
  const dl = fmtDeadline(c.deadline);
  return {
    id: m.match_id,
    title: c.title || "Untitled",
    agency: c.agency || "Federal Agency",
    naics: c.naics_code || "",
    psc: c.psc_code || "",
    state: c.state || "",
    value: fmtVal(c.value_min, c.value_max),
    valueMin: c.value_min ?? null,
    valueMax: c.value_max ?? null,
    posted: fmtDate(c.posted_date),
    postedRaw: c.posted_date || null,
    deadline: dl.label,
    deadlineRaw: c.deadline || null,
    deadlineDays: dl.days,
    score: m.score,
    setAside: c.set_aside || "",
    matchedBy,
    matchLabel,
    url: c.url || null,
    matchedAt: m.matched_at || null,
  };
}

/* ─── Sort options ────────────────────────────────────────────────── */
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score",        label: "Best match" },
  { value: "deadline",     label: "Soonest deadline" },
  { value: "value_min",    label: "Highest value" },
  { value: "posted_date",  label: "Most recent" },
];

const PER_PAGE = 15;

const EXPORT_DAY_OPTIONS = [7, 14, 30, 60, 90];

import { supabase } from "@/lib/supabase";

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ContractsPage() {
  const [contracts,  setContracts]  = useState<ContractRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [isColdStart,setIsColdStart]= useState(false);
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [error,      setError]      = useState(false);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [minScore,   setMinScore]   = useState(0);
  const [search,     setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy,     setSortBy]     = useState<SortKey>("score");
  const [sortOpen,   setSortOpen]   = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('naics_codes').single();
      if (data?.naics_codes) setNaicsCodes(data.naics_codes);
    })();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchMatches = async (p: number, s: number, q: string, sort: SortKey) => {
    const params = new URLSearchParams({
      page: String(p),
      per_page: String(PER_PAGE),
      min_score: String(s),
      sort: sort,
    });
    if (q) params.set("search", q);
    const res = await fetch(`/api/user-matches?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const load = useCallback(async () => {
    if (!isColdStart) setLoading(true);
    setError(false);
    try {
      const json = await fetchMatches(page, minScore, search, sortBy);
      const rows = (json.matches || []).map(mapRow);
      setContracts(rows);
      setTotal(json.pagination?.total || 0);

      // Handle cold start polling if totally empty and no filters applied
      if (rows.length === 0 && minScore === 0 && search === "" && page === 1) {
        setIsColdStart(true);
        const interval = setInterval(async () => {
          try {
            const refreshed = await fetchMatches(1, 0, "", "score");
            if (refreshed.matches?.length > 0) {
              setContracts(refreshed.matches.map(mapRow));
              setTotal(refreshed.pagination?.total || 0);
              setIsColdStart(false);
              clearInterval(interval);
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 30_000);
        setTimeout(() => clearInterval(interval), 600_000);
      } else {
        setIsColdStart(false);
      }
    } catch {
      setError(true);
    } finally {
      if (!isColdStart) setLoading(false);
    }
  }, [page, minScore, search, sortBy, isColdStart]);

  useEffect(() => { load(); }, [page, minScore, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
  }

  async function handleExportCSV(days: number) {
    setExporting(true);
    setExportOpen(false);
    try {
      const res = await fetch(`/api/export/csv?days=${days}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().split("T")[0];
      a.download = `plexovia-matches-${days}d-${today}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Best match";

  return (
    <div className="dash-main">

      {/* Page header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Contract Matches</h1>
          <p className="dash-page-sub">
            {total > 0
              ? `${total.toLocaleString()} contracts matched your profile · Sorted by ${currentSortLabel.toLowerCase()}`
              : "Matches appear here after the engine's nightly scan"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Export CSV with day range dropdown */}
          {contracts.length > 0 && (
            <div ref={exportRef} style={{ position: "relative" }}>
              <button
                className="dash-btn"
                onClick={() => setExportOpen(v => !v)}
                disabled={exporting}
                aria-haspopup="listbox"
                aria-expanded={exportOpen}
                aria-label="Export contracts as CSV"
              >
                {exporting ? (
                  <RefreshCw size={13} className="spin" aria-hidden="true" />
                ) : (
                  <Download size={13} aria-hidden="true" />
                )}
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              {exportOpen && (
                <div
                  role="listbox"
                  aria-label="Export date range"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    background: "var(--app-surface)",
                    border: "1px solid var(--app-border)",
                    borderRadius: "10px",
                    padding: "4px",
                    zIndex: 50,
                    minWidth: "170px",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
                  }}
                >
                  {EXPORT_DAY_OPTIONS.map(d => (
                    <button
                      key={d}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleExportCSV(d)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "7px",
                        border: "none",
                        background: "none",
                        color: "var(--app-muted)",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <Calendar size={12} aria-hidden="true" />
                      Last {d} days
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh */}
          <button
            className="dash-btn"
            onClick={load}
            aria-label="Refresh contract matches"
            disabled={loading}
          >
            <RefreshCw size={13} aria-hidden="true" className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>

        {/* Server-side search */}
        <form onSubmit={handleSearchSubmit} style={{ position: "relative", flex: 1, minWidth: "220px" }} role="search">
          <label htmlFor="contract-search" className="sr-only">Search contracts</label>
          <Search
            size={13}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-muted)", pointerEvents: "none" }}
            aria-hidden="true"
          />
          <input
            id="contract-search"
            type="search"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            placeholder="Search title, agency, NAICS, state…"
            className="dash-input"
            style={{ paddingLeft: 30 }}
          />
        </form>

        {/* Min score filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} role="group" aria-label="Minimum match score filter">
          <Filter size={12} color="var(--app-muted)" aria-hidden="true" />
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", whiteSpace: "nowrap" }}>Min score:</span>
          {[0, 50, 75, 90].map(s => (
            <button
              key={s}
              className={`dash-pill${minScore === s ? " active" : ""}`}
              aria-pressed={minScore === s}
              onClick={() => { setMinScore(s); setPage(1); }}
            >
              {s === 0 ? "All" : `${s}+`}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="dash-btn"
            onClick={() => setSortOpen(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            aria-label={`Sort by: ${currentSortLabel}`}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {currentSortLabel}
          </button>
          {sortOpen && (
            <div
              role="listbox"
              aria-label="Sort options"
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: "var(--app-surface)",
                border: "1px solid var(--app-border)",
                borderRadius: "10px",
                padding: "4px",
                zIndex: 50,
                minWidth: "160px",
                boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
              }}
            >
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  role="option"
                  aria-selected={sortBy === o.value}
                  onClick={() => { setSortBy(o.value); setSortOpen(false); setPage(1); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "7px",
                    border: "none",
                    background: sortBy === o.value ? "rgba(201,168,76,0.1)" : "none",
                    color: sortBy === o.value ? "var(--accent)" : "var(--app-muted)",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="dash-card" style={{ marginBottom: "1rem" }}>
        {/* Table head */}
        <div
          className="dash-table-head dash-hide-mobile"
          style={{ display: "grid", gridTemplateColumns: "70px 1fr 80px 100px 110px" }}
        >
          <span className="dash-th">Score</span>
          <span className="dash-th">Contract</span>
          <span className="dash-th">State</span>
          <span className="dash-th">Value</span>
          <span className="dash-th">Deadline</span>
        </div>

        {/* Content */}
        {isColdStart ? (
          <EmptyState
            icon={<RefreshCw size={28} className="spin" style={{ color: "var(--accent)" }} />}
            title="Matching contracts to your profile now"
            message={`Searching NAICS codes: ${naicsCodes.join(", ")}\nThis takes 2–5 minutes on first login.\nThis page will update automatically — no refresh needed.`}
          />
        ) : loading ? (
          <SkeletonRows rows={6} columns={5} columnWidths="70px 1fr 80px 100px 110px" />
        ) : error ? (
          <ErrorState
            message="Could not load your contract matches. The engine may be starting up."
            onRetry={load}
          />
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={total === 0 ? "No matches yet" : "No contracts match your search"}
            message={
              total === 0
                ? "The engine scans nightly. Set up your NAICS codes and keywords in Profile, then check back tomorrow."
                : "Try adjusting your search or lowering the score threshold."
            }
          />
        ) : (
          contracts.map(c => (
            <ContractRowUI key={c.id} c={c} />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !isColdStart && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>
            Page {page} of {totalPages} · {total.toLocaleString()} total matches
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="dash-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={13} aria-hidden="true" /> Prev
            </button>
            <button
              className="dash-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              Next <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

/* ─── Row component ───────────────────────────────────────────────── */
function ContractRowUI({ c }: { c: ContractRow }) {
  const deadlineColor =
    c.deadline === "Expired" ? "#F87171"
    : c.deadlineDays !== null && c.deadlineDays <= 7 ? "#FBBF24"
    : "var(--app-muted)";

  return (
    <div
      className="dash-table-row"
      style={{
        display: "grid",
        gridTemplateColumns: "70px 1fr 80px 100px 110px",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem 1.5rem",
      }}
    >
      {/* Score */}
      <div>
        <ScoreBadge score={c.score} />
      </div>

      {/* Title + all match signal badges */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.3 }}>
          {c.title}
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {/* NAICS badge */}
          {c.naics && (
            <span className="dash-tag dash-tag-green" title={`NAICS: ${c.naics}`}>
              <FileText size={9} aria-hidden="true" />
              NAICS {c.naics}
            </span>
          )}
          {/* PSC badge */}
          {c.psc && (
            <span className="dash-tag dash-tag-blue" title={`PSC: ${c.psc}`}>
              <Tag size={9} aria-hidden="true" />
              PSC {c.psc}
            </span>
          )}
          {/* Set-aside badge */}
          {c.setAside && c.setAside !== "Full & Open" && (
            <span className="dash-tag dash-tag-amber" title={`Set-Aside: ${c.setAside}`}>
              <Shield size={9} aria-hidden="true" />
              {c.setAside}
            </span>
          )}
        </div>
      </div>

      {/* State */}
      <div
        className="dash-hide-mobile"
        style={{ fontSize: "0.78rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 4 }}
      >
        <MapPin size={10} color="var(--app-faint)" aria-hidden="true" />
        {c.state || "—"}
      </div>

      {/* Value */}
      <div
        className="dash-mono"
        style={{ fontSize: "0.8125rem", fontWeight: 600, color: c.value === "TBD" ? "var(--app-muted)" : "var(--app-text)" }}
        aria-label={`Value: ${c.value}`}
      >
        {c.value}
      </div>

      {/* Deadline + link */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span
          style={{ fontSize: "0.72rem", color: deadlineColor, fontWeight: c.deadlineDays !== null && c.deadlineDays <= 7 ? 600 : 400 }}
          aria-label={`Deadline: ${c.deadline}`}
        >
          {c.deadline}
        </span>
        {c.url && (
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View on SAM.gov: ${c.title}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none" }}
          >
            SAM.gov <ExternalLink size={9} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}
