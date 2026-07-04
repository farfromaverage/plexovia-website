"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { engineFetch } from "@/lib/engine";
import {
  LayoutList, XCircle, Bookmark, ArrowRight, Search, X,
  ChevronDown, ChevronUp, AlertTriangle, Clock, TrendingUp,
  RefreshCw, SearchX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PipelineColumn from "./PipelineColumn";
import PipelineDrawer from "./PipelineDrawer";
import PipeSkeleton from "./PipeSkeleton";
import {
  type PipelineItem,
  type StageColumn,
  type ScorecardData,
  ACTIVE_STAGES,
  TERMINAL_STAGES,
  fmtDeadline,
} from "./pipeline-helpers";

/* ─── Scorecard ─────────────────────────────────────────────── */
function Scorecard({ data }: { data: ScorecardData }) {
  const items = [
    { label: "Total Tracked", value: data.total_tracked, color: "var(--app-text)" },
    { label: "Active Pursuits", value: data.active_pursuits, color: data.active_pursuits > 0 ? "var(--accent)" : "var(--app-muted)" },
    { label: "Submitted", value: data.proposals_submitted, color: "var(--app-text)" },
    { label: "Wins", value: data.wins, color: data.wins > 0 ? "var(--success)" : "var(--app-muted)" },
    { label: "Not Awarded", value: data.not_awarded, color: data.not_awarded > 0 ? "var(--danger)" : "var(--app-muted)" },
    { label: "Win Rate", value: data.win_rate !== null ? `${data.win_rate}%` : "—", color: data.win_rate !== null ? (data.win_rate >= 30 ? "var(--success)" : "var(--warning-text)") : "var(--app-muted)" },
  ];

  return (
    <motion.div
      className="pipe-scorecard"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="pipe-stat"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
          aria-label={`${item.label}: ${item.value}`}
        >
          <span className="pipe-stat-value" style={{ color: item.color }}>{item.value}</span>
          <span className="pipe-stat-label">{item.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Intelligence Strip ────────────────────────────────────── */
function IntelligenceStrip({ stages }: { stages: StageColumn[] }) {
  const activeItems = useMemo(() => {
    const items: PipelineItem[] = [];
    for (const col of stages) {
      if (ACTIVE_STAGES.includes(col.stage as typeof ACTIVE_STAGES[number])) {
        items.push(...col.items);
      }
    }
    return items;
  }, [stages]);

  const intel = useMemo(() => {
    let danger = 0;
    let warning = 0;
    let noNotes = 0;
    let highValue = 0;

    for (const item of activeItems) {
      const d = fmtDeadline(item.deadline);
      if (d.urgency === "danger") danger++;
      else if (d.urgency === "warning") warning++;
      if (!item.pipeline_notes) noNotes++;
      const val = Math.max(item.value_min || 0, item.value_max || 0);
      if (val >= 100000) highValue++;
    }

    const items: { label: string; count: number; urgency: "danger" | "warning" | "accent"; icon: React.ReactNode }[] = [];

    if (danger > 0) {
      items.push({
        label: danger === 1 ? "deadline within 3 days" : "deadlines within 3 days",
        count: danger, urgency: "danger",
        icon: <AlertTriangle size={14} aria-hidden="true" />,
      });
    }
    if (warning > 0) {
      items.push({
        label: warning === 1 ? "deadline this week" : "deadlines this week",
        count: warning, urgency: "warning",
        icon: <Clock size={14} aria-hidden="true" />,
      });
    }
    if (noNotes > 0) {
      items.push({
        label: noNotes === 1 ? "opportunity without notes" : "opportunities without notes",
        count: noNotes, urgency: "accent",
        icon: <TrendingUp size={14} aria-hidden="true" />,
      });
    }
    if (highValue > 0) {
      items.push({
        label: highValue === 1 ? "high-value pursuit" : "high-value pursuits",
        count: highValue, urgency: "accent",
        icon: <TrendingUp size={14} aria-hidden="true" />,
      });
    }

    return items;
  }, [activeItems]);

  if (intel.length === 0) return null;

  return (
    <motion.div
      className="pipe-intelligence"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      role="status"
      aria-label="Pipeline status alerts"
    >
      {intel.map((item, i) => (
        <div key={i} className="pipe-intel-item" data-urgency={item.urgency}>
          {item.icon}
          <span className="pipe-intel-count">{item.count}</span>
          <span>{item.label}</span>
          <span className="sr-only"> — {item.urgency}</span>
        </div>
      ))}
    </motion.div>
  );
}

/* ─── Waiting State ─────────────────────────────────────────── */
function WaitingState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      className="pipe-empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="pipe-empty-icon">
        <Bookmark size={24} style={{ color: "var(--accent)" }} aria-hidden="true" />
      </div>
      <h2 className="pipe-empty-title">
        Your Pipeline is Waiting
      </h2>
      <p className="pipe-empty-msg">
        Bookmark contracts you want to pursue from the Discover page. Each bookmarked contract enters your pipeline so you can track it from qualifying to award.
      </p>
      <div className="pipe-empty-actions">
        <Link href="/dashboard/contracts" className="dash-btn dash-btn-primary">
          Discover Contracts <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <button onClick={onRetry} className="dash-btn">Retry</button>
      </div>
    </motion.div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function PipelinePage() {
  const router = useRouter();
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  const [stages, setStages] = useState<StageColumn[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [firstSession, setFirstSession] = useState(false);
  const [sortBy, setSortBy] = useState<"updated" | "score" | "deadline" | "value">("updated");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerItem, setDrawerItem] = useState<PipelineItem | null>(null);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  /* ── Search debounce (150ms) ── */
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ── Sort + filter ── */
  const processedStages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stages.map((col) => {
      let items = col.items;

      if (q) {
        items = items.filter((i: PipelineItem) => {
          const haystack = [
            i.title, i.agency, i.naics_code, i.naics_title,
            i.psc_code, i.solicitation_number, i.set_aside,
          ].join(" ").toLowerCase();
          return haystack.includes(q);
        });
      }

      if (sortBy !== "updated") {
        items = [...items].sort((a, b) => {
          if (sortBy === "score") return (b.score || 0) - (a.score || 0);
          if (sortBy === "deadline") {
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          }
          if (sortBy === "value") {
            const va = Math.max(a.value_min || 0, a.value_max || 0);
            const vb = Math.max(b.value_min || 0, b.value_max || 0);
            return vb - va;
          }
          return 0;
        });
      }

      return { ...col, items, count: items.length };
    });
  }, [stages, sortBy, searchQuery]);

  const activeStages = processedStages.filter((s) =>
    ACTIVE_STAGES.includes(s.stage as typeof ACTIVE_STAGES[number])
  );
  const terminalStages = processedStages.filter((s) =>
    TERMINAL_STAGES.includes(s.stage as typeof TERMINAL_STAGES[number])
  );

  const totalFiltered = useMemo(() =>
    processedStages.reduce((a, s) => a + s.count, 0), [processedStages]
  );

  const terminalCounts = useMemo(() => {
    const awarded = terminalStages.find((s) => s.stage === "awarded")?.count || 0;
    const notAwarded = terminalStages.find((s) => s.stage === "not_awarded")?.count || 0;
    const noBid = terminalStages.find((s) => s.stage === "no_bid")?.count || 0;
    return { awarded, notAwarded, noBid, total: awarded + notAwarded + noBid };
  }, [terminalStages]);

  /* ── Data fetching ── */
  const fetchPipeline = useCallback(async () => {
    try {
      const res = await engineFetch("/api/user/pipeline");
      if (!res.ok) {
        if (res.status === 401 || res.status >= 500) {
          const fallbackRes = await fetch("/api/user-pipeline-data");
          if (!fallbackRes.ok) throw new Error(`Fallback HTTP ${fallbackRes.status}`);
          const fallbackJson = await fallbackRes.json();
          setStages(fallbackJson.stages || []);
          setScorecard(fallbackJson.scorecard || null);
          setLastUpdated(fallbackJson.last_updated || null);
          setErrorCode(null);
          retryCountRef.current = 0;
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();

      const allNaics: Set<string> = new Set();
      for (const col of (json.stages || [])) {
        for (const item of col.items || []) {
          if (item.naics_code) allNaics.add(item.naics_code);
        }
      }

      let awardMap: Record<string, number> = {};
      if (allNaics.size > 0) {
        try {
          const params = new URLSearchParams();
          allNaics.forEach((n) => params.append("naics_codes", n));
          const countRes = await engineFetch(`/api/user/competitors/award-counts?${params.toString()}`);
          if (countRes.ok) {
            const countJson = await countRes.json();
            awardMap = countJson.award_counts || {};
          }
        } catch { /* best-effort */ }
      }

      for (const col of (json.stages || [])) {
        for (const item of col.items || []) {
          item.award_count = awardMap[item.naics_code] || 0;
        }
      }

      setStages(json.stages || []);
      setScorecard(json.scorecard || null);
      setLastUpdated(json.last_updated || null);
      setDiagnostics(json.diagnostics || []);
      const itemsInQualifying = (json.stages || []).find((s: StageColumn) => s.stage === "qualifying")?.items?.length || 0;
      const itemsInOther = (json.stages || []).filter((s: StageColumn) => s.stage !== "qualifying").reduce((a: number, s: StageColumn) => a + (s.items?.length || 0), 0);
      setFirstSession(itemsInQualifying > 0 && itemsInOther === 0);
      setErrorCode(null);
      retryCountRef.current = 0;
    } catch (err: unknown) {
      const status = err instanceof Error && /^HTTP (\d+)$/.test(err.message)
        ? parseInt(err.message.match(/^HTTP (\d+)$/)![1])
        : null;
      setErrorCode(status ?? 0);
      if (!status || status >= 500) {
        if (retryCountRef.current < 3) {
          const delays = [3000, 6000, 12000];
          const delay = delays[retryCountRef.current];
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(() => fetchPipeline(), delay);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      fetchPipeline();
    });
  }, [router, fetchPipeline]);

  useEffect(() => {
    const retryTimer = retryTimerRef.current;
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  /* ── Mutation helper — optimistic update, refetch only on failure ── */
  const mutate = useCallback(async (matchId: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, ...body }),
      });
      if (!res.ok) {
        setMutationError(`Update failed (${res.status}). Reverting...`);
        await fetchPipeline();
        setTimeout(() => setMutationError(null), 4000);
        return false;
      }
      return true;
    } catch {
      setMutationError("Network error. Reverting...");
      await fetchPipeline();
      setTimeout(() => setMutationError(null), 4000);
      return false;
    }
  }, [fetchPipeline]);

  /* ── Mutations ── */
  const handleStageChange = async (matchId: string, newStage: string) => {
    const currentItem = stages.flatMap((s) => s.items).find((i) => i.match_id === matchId);
    if (currentItem?.pipeline_stage === newStage) return;

    setStages((prev) => {
      const updated = prev.map((col) => ({ ...col, items: [...col.items] }));
      let moved: PipelineItem | null = null;
      for (const col of updated) {
        const idx = col.items.findIndex((i) => i.match_id === matchId);
        if (idx !== -1) {
          moved = { ...col.items[idx], pipeline_stage: newStage };
          col.items.splice(idx, 1);
          col.count = col.items.length;
          break;
        }
      }
      if (moved) {
        const targetCol = updated.find((c) => c.stage === newStage);
        if (targetCol) {
          targetCol.items.push(moved);
          targetCol.count = targetCol.items.length;
        }
      }
      return updated;
    });

    if (drawerItem?.match_id === matchId) {
      setDrawerItem({ ...drawerItem, pipeline_stage: newStage });
    }

    await mutate(matchId, { pipeline_stage: newStage });
  };

  const handleNotesUpdate = async (matchId: string, notes: string) => {
    setStages((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.map((i) =>
          i.match_id === matchId ? { ...i, pipeline_notes: notes } : i
        ),
      }))
    );
    if (drawerItem?.match_id === matchId) {
      setDrawerItem({ ...drawerItem, pipeline_notes: notes });
    }
    await mutate(matchId, { pipeline_notes: notes });
  };

  const handleUrlAdd = async (matchId: string, url: string) => {
    let newUrls: string[] = [];
    setStages((prev) => {
      const updated = prev.map((col) => ({
        ...col,
        items: col.items.map((i) =>
          i.match_id === matchId
            ? { ...i, reference_urls: [...(i.reference_urls || []), url] }
            : i
        ),
      }));
      const item = updated.flatMap((s) => s.items).find((i) => i.match_id === matchId);
      newUrls = item?.reference_urls || [];
      return updated;
    });
    if (drawerItem?.match_id === matchId) {
      setDrawerItem({ ...drawerItem, reference_urls: [...(drawerItem.reference_urls || []), url] });
    }
    await mutate(matchId, { reference_urls: newUrls });
  };

  const handleUrlRemove = async (matchId: string, url: string) => {
    let newUrls: string[] = [];
    setStages((prev) => {
      const updated = prev.map((col) => ({
        ...col,
        items: col.items.map((i) =>
          i.match_id === matchId
            ? { ...i, reference_urls: (i.reference_urls || []).filter((u) => u !== url) }
            : i
        ),
      }));
      const item = updated.flatMap((s) => s.items).find((i) => i.match_id === matchId);
      newUrls = item?.reference_urls || [];
      return updated;
    });
    if (drawerItem?.match_id === matchId) {
      setDrawerItem({ ...drawerItem, reference_urls: (drawerItem.reference_urls || []).filter((u) => u !== url) });
    }
    await mutate(matchId, { reference_urls: newUrls });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPipeline();
  };

  const handleManualRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
    setErrorCode(null);
    setLoading(true);
    fetchPipeline();
  };

  /* ── Loading state ── */
  if (loading) {
    return <PipeSkeleton />;
  }

  const hasItems = stages.some((s) => s.count > 0);

  /* ── Unrecoverable error ── */
  if (errorCode !== null && !hasItems) {
    return (
      <div className="dash-main pipe-error-state">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", maxWidth: 400 }}>
          <div className="pipe-error-icon">
            <XCircle size={22} style={{ color: "var(--danger)" }} aria-hidden="true" />
          </div>
          <p className="pipe-error-title">
            Could not load pipeline {errorCode !== 0 ? `(${errorCode})` : ""}
          </p>
          <p className="pipe-error-msg">
            {errorCode === 401
              ? "Your session has expired. Sign out and sign back in to continue."
              : errorCode === 500
              ? "The server encountered an error. This may be a temporary issue — please try again."
              : errorCode === 429
              ? "Too many requests. Please wait a moment and try again."
              : "The server is temporarily unavailable. Your data is safe — please try again."}
          </p>
          {errorCode === 401 ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); router.replace("/auth/login"); }}
              className="dash-btn dash-btn-danger"
            >
              Sign Out
            </button>
          ) : (
            <button onClick={handleManualRetry} className="dash-btn dash-btn-primary">
              Retry
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!hasItems) {
    return (
      <div className="dash-main">
        <WaitingState onRetry={handleManualRetry} />
      </div>
    );
  }

  /* ── Populated pipeline ── */
  return (
    <>
    <motion.div
      className="dash-main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      aria-hidden={!!drawerItem}
    >
      {/* Header */}
      <motion.div
        className="dash-page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        <div>
          <h1 className="dash-page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LayoutList size={22} color="var(--accent)" aria-hidden="true" />
            Pipeline
          </h1>
          <p className="dash-page-sub">
            {scorecard ? (
              <>
                {scorecard.active_pursuits > 0
                  ? `${scorecard.active_pursuits} in active pursuit · ${scorecard.proposals_submitted} submitted`
                  : "Move opportunities through stages as you work them"}
                {lastUpdated && (
                  <span style={{ marginLeft: 10, color: "var(--app-faint)", fontSize: "0.7rem" }}>
                    Updated {new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </>
            ) : "Track every opportunity from discovery to award"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="dash-btn"
          disabled={refreshing}
          aria-label="Refresh pipeline"
        >
          <RefreshCw size={14} className={refreshing ? "dash-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </motion.div>

      {/* First-session hint */}
      {firstSession && (
        <motion.div
          className="pipe-first-session"
          role="status"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          Click any card to review it, add research notes, then advance it to the next stage. Your pipeline tracks every step from qualifying to award.
        </motion.div>
      )}

      {/* Mutation error toast */}
      <AnimatePresence>
        {mutationError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="dash-alert-error"
            style={{ marginBottom: "var(--space-4)" }}
            role="alert"
          >
            <XCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{mutationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recoverable error banner */}
      {errorCode !== null && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-alert-error"
          style={{ marginBottom: "var(--space-4)" }}
        >
          <XCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span style={{ flex: 1 }}>
            Could not refresh {errorCode !== 0 ? `(${errorCode})` : ""}. Showing previously loaded data.{" "}
            <button
              onClick={handleManualRetry}
              style={{ color: "var(--danger)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
            >
              Retry
            </button>
          </span>
        </motion.div>
      )}

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          {diagnostics.map((msg, i) => (
            <div key={i} className="dash-alert-warning" style={{ marginBottom: 6, fontSize: "0.75rem" }}>
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Intelligence strip */}
      <IntelligenceStrip stages={stages} />

      {/* Command bar */}
      <div className="pipe-command-bar">
        <div className="pipe-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title, agency, NAICS, solicitation..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search pipeline by title, agency, NAICS, or solicitation number"
          />
          {searchInput && (
            <button
              className="pipe-search-clear"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="pipe-sort">
          <label htmlFor="pipe-sort-select">Sort:</label>
          <select
            id="pipe-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort pipeline by"
          >
            <option value="updated">Last Updated</option>
            <option value="score">Match Score</option>
            <option value="deadline">Deadline</option>
            <option value="value">Value</option>
          </select>
        </div>
      </div>

      {/* aria-live: search results announcement */}
      <div aria-live="polite" className="sr-only">
        {searchQuery ? `${totalFiltered} result${totalFiltered === 1 ? "" : "s"} for "${searchQuery}"` : ""}
      </div>

      {/* Scorecard */}
      {scorecard && <Scorecard data={scorecard} />}

      {/* Empty search results */}
      {searchQuery && totalFiltered === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "3rem 1rem", textAlign: "center",
          }}
        >
          <SearchX size={32} style={{ color: "var(--app-faint)", marginBottom: "var(--space-3)" }} aria-hidden="true" />
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--app-text)", margin: "0 0 4px" }}>
            No opportunities match "{searchQuery}"
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: "0 0 1rem" }}>
            Try a different search term or clear the search.
          </p>
          <button onClick={() => setSearchInput("")} className="dash-btn">
            Clear Search
          </button>
        </motion.div>
      ) : (
        <>
          {/* Active pipeline board */}
          <motion.div
            className="pipe-board"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            {activeStages.map((col) => (
              <PipelineColumn
                key={col.stage}
                column={col}
                onAdvance={handleStageChange}
                onOpen={setDrawerItem}
              />
            ))}
          </motion.div>

          {/* Terminal section */}
          {terminalCounts.total > 0 && (
            <div className="pipe-terminal-section">
              <button
                className="pipe-terminal-header"
                onClick={() => setTerminalExpanded(!terminalExpanded)}
                aria-expanded={terminalExpanded}
                aria-controls="pipe-terminal-board"
                aria-label="Toggle completed opportunities"
              >
                <span className="pipe-terminal-title">
                  {terminalExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  Completed
                </span>
                <span className="pipe-terminal-counts">
                  {terminalCounts.awarded > 0 && (
                    <span style={{ color: "var(--success)" }}>
                      <b>{terminalCounts.awarded}</b> Won
                    </span>
                  )}
                  {terminalCounts.notAwarded > 0 && (
                    <span style={{ color: "var(--danger)" }}>
                      <b>{terminalCounts.notAwarded}</b> Lost
                    </span>
                  )}
                  {terminalCounts.noBid > 0 && (
                    <span style={{ color: "var(--app-muted)" }}>
                      <b>{terminalCounts.noBid}</b> No Bid
                    </span>
                  )}
                </span>
              </button>
              <AnimatePresence>
                {terminalExpanded && (
                  <motion.div
                    id="pipe-terminal-board"
                    className="pipe-terminal-board"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {terminalStages.map((col) => (
                      <PipelineColumn
                        key={col.stage}
                        column={col}
                        onAdvance={handleStageChange}
                        onOpen={setDrawerItem}
                        compact
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Detail drawer — outside aria-hidden so role="dialog" is visible to AT */}
      <PipelineDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onStageChange={handleStageChange}
        onNotesUpdate={handleNotesUpdate}
        onUrlAdd={handleUrlAdd}
        onUrlRemove={handleUrlRemove}
      />
    </motion.div>
    </>
  );
}
