"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText, MapPin, Shield, ExternalLink, Tag, Star,
  ChevronLeft, ChevronRight, ChevronDown, Filter, Search, RefreshCw,
  ArrowUpDown, Download, Calendar, X,
} from "lucide-react";
import { motion } from "framer-motion";
import ScoreBadge from "../components/ScoreBadge";
import NextStepsPanel from "../components/NextStepsPanel";
import SkeletonRows from "../components/SkeletonRows";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { useContractStatus } from "@/hooks/useContractStatus";
import { supabase } from "@/lib/supabase";

/* ─── Types ───────────────────────────────────────────────────────── */
interface ContractRow {
  id: string; title: string; agency: string; naics: string; psc: string;
  state: string; posted: string; postedRaw: string | null; deadline: string;
  deadlineRaw: string | null; deadlineDays: number | null;
  score: number; setAside: string; matchedBy: "naics" | "keyword";
  matchLabel: string; url: string | null; matchedAt: string | null;
  winProbability: number | null;
  winFactors: Record<string, number> | null;
  nextSteps: NextStep[];
}
interface NextStep {
  step_type: string;
  title: string;
  description: string;
  priority: number;
  action_url: string | null;
  action_label: string | null;
}
type SortKey = "score" | "deadline" | "posted_date";
type StatusFilter = "all" | "new" | "bookmarked" | "dismissed";

/* ─── Helpers ─────────────────────────────────────────────────────── */

function fmtDate(d: string | null) {
  if (!d) return "N/A";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDeadline(d: string | null): { label: string; days: number | null } {
  if (!d) return { label: "Not Listed", days: null };
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
  const kwR = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy = naicsR ? "naics" : "keyword";
  const matchLabel = naicsR
    ? `NAICS ${naicsR.replace("naics:", "")}`
    : kwR ? `Keyword: ${kwR.replace("keyword:", "")}` : "Keyword match";
  const dl = fmtDeadline(c.deadline);
  return {
    id: m.match_id, title: c.title || "Untitled",
    agency: c.agency || "Federal Agency", naics: c.naics_code || "",
    psc: c.psc_code || "", state: c.state || "",
    posted: fmtDate(c.posted_date), postedRaw: c.posted_date || null,
    deadline: dl.label, deadlineRaw: c.deadline || null, deadlineDays: dl.days,
    score: m.score, setAside: c.set_aside || "",
    matchedBy, matchLabel, url: c.url || null,
    matchedAt: m.matched_at || null,
    winProbability: m.win_probability ?? null,
    winFactors: m.win_factors ?? null,
    nextSteps: m.next_steps || [],
  };
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Best match" },
  { value: "deadline", label: "Soonest deadline" },
  { value: "posted_date", label: "Most recent" },
];
const PER_PAGE = 15;
const EXPORT_DAY_OPTIONS = [7, 14, 30, 60, 90];

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ContractsPageWrapper() {
  return (
    <Suspense fallback={<div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}><div style={{ width: 28, height: 28, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>}>
      <ContractsPage />
    </Suspense>
  );
}

function ContractsPage() {
  const searchParams = useSearchParams(); // Gap 2 fix
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isColdStart, setIsColdStart] = useState(false);
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortOpen, setSortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [undoId, setUndoId] = useState<string | null>(null);
  const [undoTitle, setUndoTitle] = useState("");
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const cs = useContractStatus();

  // Gap 2: read ?search= from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearch(urlSearch);
      setSearchInput(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("naics_codes").single();
      if (data?.naics_codes) setNaicsCodes(data.naics_codes);
    })();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchMatches = async (p: number, s: number, q: string, sort: SortKey) => {
    const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE), min_score: String(s), sort });
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
          } catch { /* polling error — silent */ }
        }, 30_000);
        setTimeout(() => clearInterval(interval), 600_000);
      } else { setIsColdStart(false); }
    } catch { setError(true); }
    finally { if (!isColdStart) setLoading(false); }
  }, [page, minScore, search, sortBy, isColdStart]);

  useEffect(() => { load(); }, [page, minScore, search, sortBy]);

  /* ── Status-filtered contracts ── */
  const filteredContracts = contracts.filter(c => {
    if (statusFilter === "bookmarked") return cs.isBookmarked(c.id);
    if (statusFilter === "dismissed") return cs.isDismissed(c.id);
    if (statusFilter === "new") return !cs.isViewed(c.id) && !cs.isDismissed(c.id);
    // "all" — show everything except dismissed
    return !cs.isDismissed(c.id);
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Best match";

  function handleSearchSubmit(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(1); }
  function handlePageChange(np: number) { setPage(Math.max(1, Math.min(totalPages, np))); }

  /* ── Dismiss with undo ── */
  function handleDismiss(c: ContractRow) {
    cs.dismiss(c.id);
    setUndoTitle(c.title);
    setUndoId(c.id);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoId(null), cs.UNDO_WINDOW_MS);
  }
  function handleUndo() {
    if (undoId) { cs.undoDismiss(undoId); setUndoId(null); }
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }

  async function handleExportCSV(days: number) {
    setExporting(true); setExportOpen(false);
    try {
      const res = await fetch(`/api/export/csv?days=${days}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plexovia-matches-${days}d-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Failed to export CSV. Please try again."); }
    finally { setExporting(false); }
  }

  const allIds = contracts.map(c => c.id);

  return (
    <div className="dash-main dash-fade-in">
      {/* Page header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Contract Matches</h1>
          <p className="dash-page-sub">
            {total > 0
              ? `${total.toLocaleString()} contracts matched your profile · Sorted by ${currentSortLabel.toLowerCase()}`
              : "Contracts are matched twice daily — set up your profile to start"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {contracts.length > 0 && (
            <div ref={exportRef} style={{ position: "relative" }}>
              <button className="dash-btn" onClick={() => setExportOpen(v => !v)} disabled={exporting} aria-haspopup="listbox" aria-expanded={exportOpen} aria-label="Export contracts as CSV">
                {exporting ? <RefreshCw size={13} className="spin" aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              {exportOpen && (
                <div className="dash-dropdown-menu" role="listbox" aria-label="Export date range">
                  {EXPORT_DAY_OPTIONS.map(d => (
                    <button key={d} className="dash-dropdown-item" role="option" aria-selected={false} onClick={() => handleExportCSV(d)}>
                      <Calendar size={12} aria-hidden="true" /> Last {d} days
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button className="dash-btn" onClick={load} aria-label="Refresh contract matches" disabled={loading}>
            <RefreshCw size={13} aria-hidden="true" className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
        <div className="dash-status-tabs" role="tablist" aria-label="Contract status filter">
          {([
            { key: "all", label: "All" },
            { key: "new", label: "New" },
            { key: "bookmarked", label: "Saved" },
            { key: "dismissed", label: "Dismissed" },
          ] as { key: StatusFilter; label: string }[]).map(tab => (
            <button
              key={tab.key}
              className="dash-status-tab"
              data-active={statusFilter === tab.key ? "true" : undefined}
              role="tab"
              aria-selected={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              {tab.key === "bookmarked" && cs.bookmarkedCount(allIds) > 0 && (
                <span className="dash-tab-count">{cs.bookmarkedCount(allIds)}</span>
              )}
              {tab.key === "dismissed" && cs.dismissedCount(allIds) > 0 && (
                <span className="dash-tab-count">{cs.dismissedCount(allIds)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        <form onSubmit={handleSearchSubmit} style={{ position: "relative", flex: 1, minWidth: "220px" }} role="search">
          <label htmlFor="contract-search" className="sr-only">Search contracts</label>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-muted)", pointerEvents: "none" }} aria-hidden="true" />
          <input
            id="contract-search" type="search" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            placeholder="Search title, agency, NAICS, state…"
            className="dash-input" style={{ paddingLeft: 30 }}
          />
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} role="group" aria-label="Minimum match score filter">
          <Filter size={12} style={{ color: "var(--app-muted)" }} aria-hidden="true" />
          <span style={{ fontSize: "0.78rem", color: "var(--app-muted)", whiteSpace: "nowrap" }}>Min score:</span>
          {[0, 50, 75, 90].map(s => (
            <button key={s} className={`dash-pill${minScore === s ? " active" : ""}`} aria-pressed={minScore === s} onClick={() => { setMinScore(s); setPage(1); }}>
              {s === 0 ? "All" : `${s}+`}
            </button>
          ))}
        </div>
        <div ref={sortRef} style={{ position: "relative" }}>
          <button className="dash-btn" onClick={() => setSortOpen(v => !v)} aria-haspopup="listbox" aria-expanded={sortOpen} aria-label={`Sort by: ${currentSortLabel}`}>
            <ArrowUpDown size={12} aria-hidden="true" /> {currentSortLabel}
          </button>
          {sortOpen && (
            <div className="dash-dropdown-menu" role="listbox" aria-label="Sort options">
              {SORT_OPTIONS.map(o => (
                <button key={o.value} className="dash-dropdown-item" role="option" data-active={sortBy === o.value ? "true" : undefined} aria-selected={sortBy === o.value} onClick={() => { setSortBy(o.value); setSortOpen(false); setPage(1); }}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="dash-card" style={{ marginBottom: "1rem" }}>
        <div className="dash-table-head dash-hide-mobile" style={{ display: "grid", gridTemplateColumns: "54px 1fr 80px 100px 100px 62px", gap: 0, alignItems: "center" }}>
          <span className="dash-th">Score</span>
          <span className="dash-th">Contract</span>
          <span className="dash-th">State</span>
          <span className="dash-th">Posted</span>
          <span className="dash-th" style={{ textAlign: "right" }}>Deadline</span>
          <span className="dash-th" style={{ textAlign: "center" }}>Actions</span>
        </div>

        {isColdStart ? (
          <EmptyState icon={<RefreshCw size={28} className="spin" style={{ color: "var(--accent)" }} />} title="Matching contracts to your profile now" message={`Searching NAICS codes: ${naicsCodes.join(", ")}\nThis takes 2–5 minutes on first login.\nThis page updates automatically — no refresh needed.`} />
        ) : loading ? (
          <SkeletonRows rows={6} columns={6} columnWidths="54px 1fr 80px 100px 100px 62px" />
        ) : error ? (
          <ErrorState message="Could not load your contract matches. The engine may be starting up." onRetry={load} />
        ) : filteredContracts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={statusFilter !== "all" ? `No ${statusFilter} contracts` : total === 0 ? "No matches yet" : "No contracts match your search"}
            message={statusFilter !== "all" ? "Try switching to the 'All' tab." : total === 0 ? "Add your NAICS codes and keywords in your Profile. Contracts are matched twice daily." : "Try adjusting your search or lowering the score threshold."}
          />
        ) : (
          filteredContracts.map(c => (
            <ContractRowUI
              key={c.id} c={c}
              isBookmarked={cs.isBookmarked(c.id)}
              isViewed={cs.isViewed(c.id)}
              onToggleBookmark={() => cs.toggleBookmark(c.id)}
              onDismiss={() => handleDismiss(c)}
              onView={() => cs.markViewed(c.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !isColdStart && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>Page {page} of {totalPages} · {total.toLocaleString()} total matches</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="dash-btn" onClick={() => handlePageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={13} aria-hidden="true" /> Prev
            </button>
            <button className="dash-btn" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
              Next <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undoId && (
        <div className="dash-undo-toast" role="alert">
          <span>Contract dismissed</span>
          <button onClick={handleUndo}>Undo</button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

/* ─── Row Component ───────────────────────────────────────────────── */
function ContractRowUI({ c, isBookmarked, isViewed, onToggleBookmark, onDismiss, onView }: {
  c: ContractRow; isBookmarked: boolean; isViewed: boolean;
  onToggleBookmark: () => void; onDismiss: () => void; onView: () => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const deadlineColor =
    c.deadline === "Expired" ? "var(--danger)"
    : c.deadlineDays !== null && c.deadlineDays <= 7 ? "var(--warning)"
    : "var(--app-muted)";

  return (<>
    <div
      className="dash-table-row"
      style={{ display: "grid", gridTemplateColumns: "54px 1fr 80px 100px 100px 62px", alignItems: "center", padding: "1rem 1.5rem", cursor: (c.winFactors || (c.nextSteps && c.nextSteps.length > 0)) ? "pointer" : "default" }}
      onMouseEnter={onView}
      onClick={() => { if (c.winFactors || (c.nextSteps && c.nextSteps.length > 0)) setExpanded(e => !e) }}
    >
      {/* Score + viewed dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {!isViewed && <span className="dash-viewed-dot" title="New — not yet viewed" />}
        <ScoreBadge score={c.score} winProbability={c.winProbability} />
        {(c.winFactors || (c.nextSteps && c.nextSteps.length > 0)) && (
          <ChevronDown size={12} style={{
            color: "var(--app-faint)", transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
          }} />
        )}
      </div>

      {/* Title + badges */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.3 }}>{c.title}</p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {c.naics && <span className="dash-tag dash-tag-green" title={`NAICS: ${c.naics}`}><FileText size={9} aria-hidden="true" /> NAICS {c.naics}</span>}
          {c.psc && <span className="dash-tag dash-tag-blue" title={`PSC: ${c.psc}`}><Tag size={9} aria-hidden="true" /> PSC {c.psc}</span>}
          {c.setAside && c.setAside !== "Full & Open" && <span className="dash-tag dash-tag-amber" title={`Set-Aside: ${c.setAside}`}><Shield size={9} aria-hidden="true" /> {c.setAside}</span>}
        </div>
      </div>

      {/* State */}
      <div className="dash-hide-mobile" style={{ fontSize: "0.78rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 4 }}>
        <MapPin size={10} style={{ color: "var(--app-faint)" }} aria-hidden="true" /> {c.state || "Nationwide"}
      </div>

      {/* Posted Date */}
      <div style={{ fontSize: "0.78rem", color: "var(--app-muted)" }} aria-label={`Posted: ${c.posted}`}>
        {c.posted}
      </div>

      {/* Deadline + SAM link */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span style={{ fontSize: "0.72rem", color: deadlineColor, fontWeight: c.deadlineDays !== null && c.deadlineDays <= 7 ? 600 : 400 }} aria-label={`Deadline: ${c.deadline}`}>
          {c.deadline}
        </span>
        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`View on SAM.gov: ${c.title}`} className="dash-link-subtle" style={{ fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 3 }}>
            SAM.gov <ExternalLink size={9} aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Actions: Bookmark + Dismiss */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <button className="dash-action-bookmark" data-active={isBookmarked ? "true" : undefined} onClick={onToggleBookmark} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark contract"} title={isBookmarked ? "Saved" : "Save"}>
          <Star size={14} fill={isBookmarked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <button className="dash-action-dismiss" onClick={onDismiss} aria-label="Dismiss contract" title="Dismiss">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
    {expanded && (c.winFactors || (c.nextSteps && c.nextSteps.length > 0)) && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ overflow: "hidden", borderBottom: "1px solid var(--app-border)", background: "var(--app-surface-2)" }}
      >
        <div style={{ padding: "0.75rem 1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)" }}>Win Probability Breakdown</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-geist-mono, monospace)" }}>
              {c.winProbability}%
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
            {Object.entries(c.winFactors || {}).map(([key, value]) => {
              const labels: Record<string, string> = {
                match_baseline: "Match quality", naics_density: "NAICS competition",
                agency_density: "Agency activity", setaside: "Set-aside qualification",
                recency: "Recency", psc_match: "PSC code match",
              }
              const pct = Math.round(value * 100)
              const isPositive = pct > 0
              return (
                <div key={key} style={{
                  padding: "0.375rem 0.5rem", background: "var(--app-surface)",
                  borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem"
                }}>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 500,
                    color: isPositive ? "var(--success)" : "var(--app-muted)",
                    fontFamily: "var(--font-geist-mono, monospace)", minWidth: "2.5rem"
                  }}>
                    {isPositive ? "+" : ""}{pct}%
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--app-muted)" }}>
                    {labels[key] || key}
                  </span>
                </div>
              )
            })}
          </div>
          {c.nextSteps && c.nextSteps.length > 0 && (
            <NextStepsPanel steps={c.nextSteps} />
          )}
        </div>
      </motion.div>
    )}
  </>
  );
}
