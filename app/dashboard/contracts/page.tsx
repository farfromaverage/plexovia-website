"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import {
  Clock, ExternalLink, FileText, MapPin, Shield, Star,
  ChevronLeft, ChevronRight, RefreshCw,
  ArrowUpDown, Download, Calendar, X,
} from "lucide-react";
import ScoreBadge from "../components/ScoreBadge";
import SkeletonRows from "../components/SkeletonRows";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { useContractStatus } from "@/hooks/useContractStatus";
import { supabase } from "@/lib/supabase";

/* ─── Types ───────────────────────────────────────────────────────── */
interface ContractRow {
  id: string; title: string; agency: string; naics: string; psc: string;
  fedOrg: string;
  state: string; posted: string; postedRaw: string | null; deadline: string;
  deadlineRaw: string | null; deadlineDays: number | null;
  score: number; setAside: string; matchedBy: "naics" | "keyword";
  matchLabel: string; url: string | null; matchedAt: string | null;
}
type SortKey = "score" | "deadline" | "posted_date";

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
    psc: c.psc_code || "", fedOrg: c.fed_org_code || "",
    state: c.state || "",
    posted: fmtDate(c.posted_date), postedRaw: c.posted_date || null,
    deadline: dl.label, deadlineRaw: c.deadline || null, deadlineDays: dl.days,
    score: m.score, setAside: c.set_aside || "",
    matchedBy, matchLabel, url: c.url || null,
    matchedAt: m.matched_at || null,

  };
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "posted_date", label: "Most recent" },
  { value: "deadline", label: "Soonest deadline" },
  { value: "score", label: "Best match" },
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
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isColdStart, setIsColdStart] = useState(false);
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("posted_date");
  const [sortOpen, setSortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [undoTitle, setUndoTitle] = useState("");
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const cs = useContractStatus();

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

  const fetchMatches = async (p: number, sort: SortKey) => {
    const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE), min_score: "0", sort });
    const res = await fetch(`/api/user-matches?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const load = useCallback(async () => {
    if (!isColdStart) setLoading(true);
    setError(false);
    try {
      const json = await fetchMatches(page, sortBy);
      const rows = (json.matches || []).map(mapRow);
      setContracts(rows);
      setTotal(json.pagination?.total || 0);
      if (rows.length === 0 && page === 1) {
        setIsColdStart(true);
        const interval = setInterval(async () => {
          try {
            const refreshed = await fetchMatches(1, "score");
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
  }, [page, sortBy, isColdStart]);

  useEffect(() => { load(); }, [page, sortBy]);

  /* ── Show all except dismissed ── */
  const visibleContracts = contracts.filter(c => !cs.isDismissed(c.id));

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Most recent";

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

      {/* Sort */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
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

      {/* Contracts */}
      <div style={{
        background: "var(--app-surface)",
        border: "1px solid var(--app-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        marginBottom: "1rem",
      }}>

        {isColdStart ? (
          <EmptyState icon={<RefreshCw size={28} className="spin" style={{ color: "var(--accent)" }} />} title="Matching contracts to your profile now" message={`Searching NAICS codes: ${naicsCodes.join(", ")}\nThis takes 2–5 minutes on first login.\nThis page updates automatically — no refresh needed.`} />
        ) : loading ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState message="Could not load your contract matches. The engine may be starting up." onRetry={load} />
        ) : visibleContracts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={total === 0 ? "No matches yet" : "No contracts found"}
            message={total === 0 ? "Add your NAICS codes and keywords in your Profile. Contracts are matched twice daily." : "Try adjusting your filters."}
          />
        ) : (
          visibleContracts.map(c => (
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
  const deadlineUrgency =
    c.deadlineDays === null ? "none"
    : c.deadlineDays <= 0 ? "expired"
    : c.deadlineDays <= 3 ? "critical"
    : c.deadlineDays <= 7 ? "warning"
    : "normal";

  return (
    <div
      className="dash-contract-card"
      style={{
        opacity: 1,
      }}
      onMouseEnter={onView}
    >
      {/* Score column */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {!isViewed && <span className="dash-viewed-dot" title="New" />}
        <ScoreBadge score={c.score} />
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <p style={{
            fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)",
            margin: 0, lineHeight: 1.35, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {c.title}
          </p>
          {/* Deadline badge — desktop */}
          <div className="dash-hide-mobile" style={{ flexShrink: 0 }}>
            <DeadlineBadge label={c.deadline} urgency={deadlineUrgency} days={c.deadlineDays} />
          </div>
        </div>

        {/* Tags: NAICS + PSC + Fed Org + Set-Aside */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          {c.naics && (
            <span className="dash-tag dash-tag-green" title={`NAICS: ${c.naics}`}>
              NAICS {c.naics}
            </span>
          )}
          {c.psc && (
            <span className="dash-tag dash-tag-blue" title={`PSC: ${c.psc}`}>
              PSC {c.psc}
            </span>
          )}
          {c.fedOrg && (
            <span className="dash-tag dash-tag-muted" title={`Federal Org: ${c.fedOrg}`}>
              {c.fedOrg}
            </span>
          )}
          {c.setAside && c.setAside !== "Full & Open" && (
            <span className="dash-tag dash-tag-amber" title={`Set-Aside: ${c.setAside}`}>
              <Shield size={9} aria-hidden="true" style={{ marginRight: 2 }} /> {c.setAside}
            </span>
          )}
        </div>

        {/* Mobile-only: State + Posted + Deadline row */}
        <div className="dash-show-mobile" style={{ marginTop: 8, display: "flex", gap: 12, fontSize: "0.72rem", color: "var(--app-muted)", flexWrap: "wrap" }}>
          <span>
            <MapPin size={10} style={{ verticalAlign: "middle", marginRight: 3, color: "var(--app-faint)" }} />
            {c.state || "Nationwide"}
          </span>
          <span>Posted {c.posted}</span>
          <DeadlineBadge label={c.deadline} urgency={deadlineUrgency} days={c.deadlineDays} />
        </div>
      </div>

      {/* Desktop metadata column */}
      <div className="dash-hide-mobile" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: "0.75rem", color: "var(--app-muted)", display: "flex", alignItems: "center", gap: 3 }}>
          <MapPin size={10} style={{ color: "var(--app-faint)" }} />
          {c.state || "Nationwide"}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>
          Posted {c.posted}
        </div>
        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="dash-link-subtle" style={{ fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 3 }}>
            SAM.gov <ExternalLink size={9} />
          </a>
        )}
      </div>

      {/* Actions column */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <button
          className="dash-action-bookmark"
          data-active={isBookmarked ? "true" : undefined}
          onClick={onToggleBookmark}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark contract"}
          title={isBookmarked ? "Saved" : "Save"}
        >
          <Star size={15} fill={isBookmarked ? "currentColor" : "none"} />
        </button>
        <button className="dash-action-dismiss" onClick={onDismiss} aria-label="Dismiss contract" title="Dismiss">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─── Deadline Badge ───────────────────────────────────────────── */
function DeadlineBadge({ label, urgency, days }: {
  label: string; urgency: string; days: number | null;
}) {
  const bg = urgency === "expired" ? "var(--danger-subtle)"
    : urgency === "critical" ? "rgba(194,59,59,0.12)"
    : urgency === "warning" ? "var(--warning-subtle)"
    : "var(--app-surface-2)";
  const fg = urgency === "expired" ? "var(--danger)"
    : urgency === "critical" ? "var(--danger)"
    : urgency === "warning" ? "var(--warning)"
    : "var(--app-muted)";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999,
      background: bg, color: fg,
      fontSize: "0.72rem", fontWeight: 600,
      whiteSpace: "nowrap", flexShrink: 0
    }}>
      <Clock size={10} />
      {label}
    </span>
  );
}
