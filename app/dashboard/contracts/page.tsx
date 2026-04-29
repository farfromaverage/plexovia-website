"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText, MapPin, Shield, ExternalLink, Tag,
  ChevronLeft, ChevronRight, Filter, Search, RefreshCw,
  ArrowUpDown, Download,
} from "lucide-react";
import ScoreBadge from "../components/ScoreBadge";
import SkeletonRows from "../components/SkeletonRows";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import type { Metadata } from "next";

/* ─── Types ───────────────────────────────────────────────────────── */
interface ContractRow {
  id: string; title: string; agency: string; naics: string;
  state: string; value: string; posted: string; deadline: string;
  deadlineDays: number | null;
  score: number; type: string; matchedBy: "naics" | "keyword";
  matchLabel: string; url: string | null;
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
  if (min && max && min !== max) return `${fmt$(min)} to ${fmt$(max)}`;
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
    state: c.state || "Federal",
    value: fmtVal(c.value_min, c.value_max),
    posted: fmtDate(c.posted_date),
    deadline: dl.label,
    deadlineDays: dl.days,
    score: m.score,
    type: c.set_aside || "Full & Open",
    matchedBy,
    matchLabel,
    url: c.url || null,
  };
}

/* ─── CSV Export ──────────────────────────────────────────────────── */
function exportCSV(contracts: ContractRow[]) {
  const headers = ["Score", "Title", "Agency", "NAICS", "State", "Value", "Posted", "Deadline", "Type", "URL"];
  const rows = contracts.map(c => [
    c.score, `"${c.title.replace(/"/g, '""')}"`, `"${c.agency.replace(/"/g, '""')}"`,
    c.naics, c.state, c.value, c.posted, c.deadline, c.type, c.url || "",
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `plexovia-contracts-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score",        label: "Best match" },
  { value: "deadline",     label: "Soonest deadline" },
  { value: "value_min",    label: "Highest value" },
  { value: "posted_date",  label: "Most recent" },
];

const PER_PAGE = 15;

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('naics_codes').single();
      if (data?.naics_codes) setNaicsCodes(data.naics_codes);
    })();
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

  useEffect(() => { load(); }, [page, minScore, search, sortBy]); // Removed load from dependency to prevent polling loop re-triggers if not handled carefully, actually better to just have it run once per dependency change.

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
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
          {/* Export */}
          {contracts.length > 0 && (
            <button
              className="dash-btn"
              onClick={() => exportCSV(contracts)}
              aria-label="Export current page results as CSV"
              title="Export to CSV"
            >
              <Download size={13} aria-hidden="true" /> Export CSV
            </button>
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
          style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 80px 110px 110px" }}
        >
          <span className="dash-th">Score</span>
          <span className="dash-th">Contract</span>
          <span className="dash-th">Agency</span>
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
          <SkeletonRows rows={6} columns={6} columnWidths="80px 1fr 140px 80px 110px 110px" />
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
        gridTemplateColumns: "80px 1fr 140px 80px 110px 110px",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem 1.5rem",
      }}
    >
      {/* Score */}
      <div>
        <ScoreBadge score={c.score} />
      </div>

      {/* Title + badges */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.3 }}>
          {c.title}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <span className={`dash-tag ${c.matchedBy === "naics" ? "dash-tag-green" : "dash-tag-blue"}`}>
            {c.matchedBy === "naics" ? <FileText size={9} aria-hidden="true" /> : <Tag size={9} aria-hidden="true" />}
            {c.matchLabel}
          </span>
          {c.type !== "Full & Open" && (
            <span className="dash-tag dash-tag-amber" aria-label={`Set-aside type: ${c.type}`}>
              {c.type}
            </span>
          )}
        </div>
      </div>

      {/* Agency */}
      <div
        className="dash-hide-mobile"
        style={{ fontSize: "0.78rem", color: "var(--app-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={c.agency}
      >
        <Shield size={10} color="var(--app-faint)" style={{ marginRight: 4, flexShrink: 0 }} aria-hidden="true" />
        {c.agency}
      </div>

      {/* State */}
      <div
        className="dash-hide-mobile"
        style={{ fontSize: "0.78rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 4 }}
      >
        <MapPin size={10} color="var(--app-faint)" aria-hidden="true" />
        {c.state}
      </div>

      {/* Value */}
      <div
        className="dash-mono"
        style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--app-text)" }}
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
