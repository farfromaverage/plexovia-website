"use client";

import { useEffect, useState, useCallback, useRef, Suspense, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, ExternalLink, FileText, MapPin, Shield, Star,
  ChevronLeft, ChevronRight, RefreshCw,
  Download, Calendar, X,
} from "lucide-react";
import MatchScoreBadge from "@/components/ui/match-score-badge";
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

interface ContractPayload {
  title?: string; agency?: string; naics_code?: string;
  psc_code?: string; fed_org_code?: string; state?: string;
  posted_date?: string; deadline?: string; set_aside?: string;
  url?: string;
}

interface MatchRow {
  match_id: string;
  contract: ContractPayload | null;
  reasons: string[];
  score: number;
  matched_at: string | null;
}

function mapRow(m: MatchRow): ContractRow {
  const c = m.contract ?? {};
  const reasons = m.reasons ?? [];
  const naicsR = reasons.find((r) => r.startsWith("naics:"));
  const kwR = reasons.find((r: string) => r.startsWith("keyword:"));
  const matchedBy = naicsR ? "naics" : "keyword";
  const matchLabel = naicsR
    ? `NAICS ${naicsR.replace("naics:", "")}`
    : kwR ? `Keyword: ${kwR.replace("keyword:", "")}` : "Keyword match";
  const dl = fmtDeadline(c.deadline ?? null);
  return {
    id: m.match_id, title: c.title || "Untitled",
    agency: c.agency || "Federal Agency", naics: c.naics_code || "",
    psc: c.psc_code || "", fedOrg: c.fed_org_code || "",
    state: c.state || "",
    posted: fmtDate(c.posted_date ?? null), postedRaw: c.posted_date || null,
    deadline: dl.label, deadlineRaw: c.deadline || null, deadlineDays: dl.days,
    score: m.score, setAside: c.set_aside || "",
    matchedBy, matchLabel, url: c.url || null,
    matchedAt: m.matched_at || null,

  };
}

const PER_PAGE = 15;
const FILTER_BATCH = 200;
const EXPORT_DAY_OPTIONS = [7, 14, 30, 60, 90];

/* ─── Page ────────────────────────────────────────────────────────── */
export default function ContractsPageWrapper() {
  return (
    <Suspense fallback={<div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}><div className="dash-spin" style={{ width: 28, height: 28, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }} /></div>}>
      <ContractsPage />
    </Suspense>
  );
}

function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [naicsCodes, setNaicsCodes] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [undoId, setUndoId] = useState<string | null>(null);
  const [undoTitle, setUndoTitle] = useState("");
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchMatches = async (p: number, pp: number = PER_PAGE, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(p), per_page: String(pp), min_score: "0", sort: "recency" });
    const res = await fetch(`/api/user-matches?${params.toString()}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const abortRef = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(false);
    try {
      const needsBatch = statusFilter === "bookmarked" || statusFilter === "dismissed";
      const pp = needsBatch ? FILTER_BATCH : PER_PAGE;
      const json = await fetchMatches(page, pp, controller.signal);
      if (controller.signal.aborted) return;
      const rows = (json.matches || []).map(mapRow);
      setContracts(rows);
      setTotal(json.pagination?.total || 0);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(true);
    }
    finally { if (abortRef.current === controller) setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [page, load]);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  /* ── Status-filtered contracts ── */
  const filteredContracts = contracts.filter(c => {
    if (statusFilter === "bookmarked") return cs.isBookmarked(c.id);
    if (statusFilter === "dismissed") return cs.isDismissed(c.id);
    if (statusFilter === "new") return !cs.isViewed(c.id) && !cs.isDismissed(c.id);
    return !cs.isDismissed(c.id);
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

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
    } catch {
      setExportError(true);
      setTimeout(() => setExportError(false), 5000);
    }
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
              ? (statusFilter !== "all"
                ? `${filteredContracts.length} of ${total.toLocaleString()} contracts`
                : `${total.toLocaleString()} contracts matched your profile`)
              : "Contracts are matched twice daily — set up your profile to start"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
          {contracts.length > 0 && (
            <div ref={exportRef} style={{ position: "relative" }}>
              <button className="dash-btn" onClick={() => setExportOpen(v => !v)} disabled={exporting} aria-haspopup="listbox" aria-expanded={exportOpen} aria-label="Export contracts as CSV">
                {exporting ? <RefreshCw size={13} className="dash-spin" aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              {exportError && <span style={{ fontSize: "0.72rem", color: "var(--danger)", marginLeft: "var(--space-2)" }}>Export failed</span>}
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
            <RefreshCw size={13} aria-hidden="true" className={loading ? "dash-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ marginBottom: "var(--space-5)" }}>
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
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            >
              {tab.label}
              {tab.key === "bookmarked" && cs.totalBookmarkedCount() > 0 && (
                <span className="dash-tab-count">{cs.totalBookmarkedCount()}</span>
              )}
              {tab.key === "dismissed" && cs.totalDismissedCount() > 0 && (
                <span className="dash-tab-count">{cs.totalDismissedCount()}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts */}
      <div style={{
        background: "var(--app-surface)",
        border: "1px solid var(--app-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        marginBottom: "var(--space-5)",
      }}>

        {loading ? (
          <SkeletonRows rows={6} />
        ) : error ? (
          <ErrorState message="Could not load your contract matches. The engine may be starting up." onRetry={load} />
        ) : filteredContracts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={total === 0 && naicsCodes.length > 0 ? "No active matches found" : statusFilter !== "all" ? `No ${statusFilter} contracts` : "No matches yet"}
            message={total === 0 && naicsCodes.length > 0
              ? "Contracts are fetched from SAM.gov twice daily at 11:00 and 18:00 UTC. Check back after the next pipeline run."
              : statusFilter !== "all" && contracts.length > 0 ? `No ${statusFilter} contracts on this page. Try browsing other pages or check the All tab.` : statusFilter !== "all" ? "Try switching to the 'All' tab." : total === 0 ? "Add your NAICS codes and keywords in your Profile. Contracts are matched twice daily." : "Try adjusting your filters."}
          />
        ) : (
          <AnimatePresence initial={false}>
            {filteredContracts.map((c, i) => (
              <ContractRowUI
                key={c.id} c={c} index={i}
                isBookmarked={cs.isBookmarked(c.id)}
                isViewed={cs.isViewed(c.id)}
                onToggleBookmark={() => cs.toggleBookmark(c.id)}
                onDismiss={() => handleDismiss(c)}
                onView={() => cs.markViewed(c.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--app-muted)" }}>
            Page {page} of {totalPages} · {total.toLocaleString()} total matches
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="dash-btn" onClick={() => handlePageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={14} aria-hidden="true" /> Prev
            </button>
            <button className="dash-btn" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
              Next <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      <AnimatePresence>
        {undoId && (
          <motion.div
            className="dash-undo-toast"
            role="alert"
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 12, x: "-50%" }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <span>Contract dismissed</span>
            <button onClick={handleUndo}>Undo</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

/* ─── Row Component ───────────────────────────────────────────────── */
const ContractRowUI = memo(function ContractRowUI({ c, isBookmarked, isViewed, onToggleBookmark, onDismiss, onView, index }: {
  c: ContractRow; isBookmarked: boolean; isViewed: boolean;
  onToggleBookmark: () => void; onDismiss: () => void; onView: () => void;
  index: number;
}) {
  const deadlineUrgency =
    c.deadlineDays === null ? "none"
    : c.deadlineDays <= 0 ? "expired"
    : c.deadlineDays <= 3 ? "critical"
    : c.deadlineDays <= 7 ? "warning"
    : "normal";

  return (
    <motion.div
      className="dash-contract-card"
      onMouseEnter={onView}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50, transition: { duration: 0.2, ease: [0.25, 1, 0.5, 1] } }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.25, 1, 0.5, 1],
      }}
    >
      {/* Score column */}
      <div className="dash-contract-card-left">
        {!isViewed && <span className="dash-viewed-dot" title="New" />}
        <MatchScoreBadge score={c.score} />
      </div>

      {/* Content column */}
      <div className="dash-contract-card-center">
        <p className="dash-contract-card-title">{c.title}</p>

        <div className="dash-contract-card-tags">
          {c.naics && (
            <span className="dash-tag dash-tag-green" title={`NAICS: ${c.naics}`}>NAICS {c.naics}</span>
          )}
          {c.psc && (
            <span className="dash-tag dash-tag-blue" title={`PSC: ${c.psc}`}>PSC {c.psc}</span>
          )}
          {c.fedOrg && (
            <span className="dash-tag dash-tag-muted" title={`Federal Org: ${c.fedOrg}`}>{c.fedOrg}</span>
          )}
          {c.setAside && c.setAside !== "Full & Open" && (
            <span className="dash-tag dash-tag-amber" title={`Set-Aside: ${c.setAside}`}>
              <Shield size={9} aria-hidden="true" style={{ marginRight: "var(--space-1)" }} /> {c.setAside}
            </span>
          )}
        </div>

        <div className="dash-show-mobile dash-contract-card-mobile-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <MapPin size={11} />{c.state || "Nationwide"}
          </span>
          <span>Posted {c.posted}</span>
          <DeadlineBadge label={c.deadline} urgency={deadlineUrgency} />
        </div>
      </div>

      {/* Desktop metadata column */}
      <div className="dash-hide-mobile dash-contract-card-right">
        <div className="dash-contract-card-meta-item">
          <MapPin size={11} />{c.state || "Nationwide"}
        </div>
        <DeadlineBadge label={c.deadline} urgency={deadlineUrgency} />
        <div className="dash-contract-card-meta-faint">Posted {c.posted}</div>
        {c.url && /^https?:\/\//i.test(c.url) && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="dash-contract-card-sam-link">
            View on SAM.gov <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Actions column */}
      <div className="dash-contract-card-actions">
        <motion.button
          className="dash-action-bookmark"
          data-active={isBookmarked ? "true" : undefined}
          onClick={onToggleBookmark}
          whileTap={{ scale: 0.85 }}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark contract"}
          title={isBookmarked ? "Saved" : "Save"}
        >
          <Star size={16} fill={isBookmarked ? "currentColor" : "none"} />
        </motion.button>
        <button className="dash-action-dismiss" onClick={onDismiss} aria-label="Dismiss contract" title="Dismiss">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
});

/* ─── Deadline Badge ───────────────────────────────────────────── */
function DeadlineBadge({ label, urgency }: {
  label: string; urgency: string;
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
    <span className="dash-deadline-badge" style={{ background: bg, color: fg }}>
      <Clock size={11} />
      {label}
    </span>
  );
}
