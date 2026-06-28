"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { engineFetch } from "@/lib/engine";
import { LayoutList, XCircle, ArrowUpDown, Bookmark, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PipelineColumn, { type PipelineItem, type StageColumn } from "./PipelineColumn";

/* ─── Types ───────────────────────────────────────────────────── */
interface PipelineStatus {
  has_bookmarks: boolean;
  bookmark_count: number;
  last_pipeline_completed_at: string | null;
}

interface ScorecardData {
  total_tracked: number;
  active_pursuits: number;
  proposals_submitted: number;
  wins: number;
  not_awarded: number;
  no_bid: number;
  win_rate: number | null;
}

/* ─── Scorecard Component ─────────────────────────────────────── */
function Scorecard({ data }: { data: ScorecardData }) {
  const items = [
    { label: "Total Tracked", value: data.total_tracked, color: "var(--app-text)" },
    { label: "Active Pursuits", value: data.active_pursuits, color: data.active_pursuits > 0 ? "var(--accent)" : "var(--app-muted)" },
    { label: "Submitted", value: data.proposals_submitted, color: "var(--app-text)" },
    { label: "Wins", value: data.wins, color: "var(--success)" },
    { label: "Not Awarded", value: data.not_awarded, color: data.not_awarded > 0 ? "var(--danger)" : "var(--app-muted)" },
    { label: "Win Rate", value: data.win_rate !== null ? `${data.win_rate}%` : "N/A", color: data.win_rate !== null ? (data.win_rate >= 30 ? "var(--success)" : "var(--warning)") : "var(--app-muted)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "var(--space-3)", marginBottom: "var(--space-5)",
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="dash-stat-card"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
        >
          <span className="dash-label">{item.label}</span>
          <p className="dash-mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: item.color, margin: "4px 0 0" }}>
            {item.value}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Waiting State Component ──────────────────────────────────── */
function WaitingState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{ padding: "4rem 2rem", textAlign: "center", maxWidth: 420, margin: "0 auto" }}
    >
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
        <Bookmark size={24} style={{ color: "var(--accent)" }} aria-hidden="true" />
      </div>
      <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--app-text)", margin: "0 0 0.5rem" }}>
        Your Pipeline is Waiting
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--app-muted)", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
        Bookmark contracts you want to pursue from the Discover page. Each bookmarked contract enters your pipeline so you can track it from qualifying to award.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/dashboard/contracts"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 8,
            background: "var(--accent)", color: "#fff",
            fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
          }}
        >
          Discover Contracts <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <button
          onClick={onRetry}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 8,
            border: "1px solid var(--app-border)", background: "transparent",
            color: "var(--app-muted)", fontWeight: 600, fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function PipelinePage() {
  const router = useRouter();
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const [stages, setStages] = useState<StageColumn[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [_pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [firstSession, setFirstSession] = useState(false);
  const [advanceCount, setAdvanceCount] = useState(0);
  const [sortBy, setSortBy] = useState<"updated" | "score" | "deadline" | "value">("updated");

  const sortedStages = useMemo(() => {
    if (sortBy === "updated") return stages;
    return stages.map((col) => {
      const sorted = [...col.items].sort((a, b) => {
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
      return { ...col, items: sorted };
    });
  }, [stages, sortBy]);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await engineFetch("/api/user/pipeline");
      if (!res.ok) {
        // Railway backend is unreachable (JWT mismatch, network, etc.).
        // Fall back to server-side Supabase query (cookie auth, same path as bookmark).
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
      setPipelineStatus(json.pipeline_status || null);
      setDiagnostics(json.diagnostics || []);
      // First session: items in qualifying only, nothing in other stages
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
      // Retry on server errors or network failures (not 4xx)
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
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      fetchPipeline();
    });
  }, [router, fetchPipeline]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const handleStageChange = async (matchId: string, newStage: string) => {
    // Skip no-op stage changes (selecting the same stage from dropdown)
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

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, pipeline_stage: newStage }),
      });
      if (!res.ok) {
        fetchPipeline();
        return;
      }
      // Refetch full pipeline to refresh scorecard, last_updated, and stage counts.
      // Uses the primary fetch path (engineFetch with SSR fallback) for resilience.
      await fetchPipeline();
      setAdvanceCount((c) => c + 1);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => setAdvanceCount(0), 4000);
    } catch {
      fetchPipeline();
    }
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
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, pipeline_notes: notes }),
      });
      if (!res.ok) fetchPipeline();
    } catch { fetchPipeline(); }
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
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, reference_urls: newUrls }),
      });
      if (!res.ok) fetchPipeline();
    } catch { fetchPipeline(); }
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
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: matchId, reference_urls: newUrls }),
      });
      if (!res.ok) fetchPipeline();
    } catch { fetchPipeline(); }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="dash-spin" style={{ width: 36, height: 36, borderWidth: "2.5px", marginBottom: "var(--space-4)" }} aria-label="Loading pipeline" role="status" />
        <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)", margin: "0 0 4px" }}>
          Loading your pipeline...
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0 }}>
          Gathering your tracked opportunities
        </p>
      </div>
    );
  }

  /* ── Has cached data? Determines error treatment ── */
  const hasItems = stages.some((s) => s.count > 0);

  /* ── Unrecoverable error (no cached data to fall back on) ── */
  if (errorCode !== null && !hasItems) {
    return (
      <div className="dash-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", maxWidth: 400 }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <XCircle size={22} style={{ color: "var(--danger)" }} aria-hidden="true" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--app-text)", margin: "0 0 0.5rem" }}>
            Could not load pipeline {errorCode !== 0 ? `(${errorCode})` : ""}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 1.25rem" }}>
            {errorCode === 401
              ? "Your session has expired. Sign out and sign back in to continue."
              : errorCode === 500
              ? "The server encountered an error. This may be a temporary issue — please try again."
              : errorCode === 429
              ? "Too many requests. Please wait a moment and try again."
              : "The server is temporarily unavailable. Your data is safe — please try again."}
          </p>
          {errorCode === 401 ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.replace("/auth/login"); }}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: "var(--danger)", color: "#fff",
                  fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
          <button
            onClick={() => { setLoading(true); setErrorCode(null); retryCountRef.current = 0; fetchPipeline(); }}
            style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              background: "var(--accent)", color: "#fff",
              fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
            }}
          >
            Retry
          </button>
          )}
        </motion.div>
      </div>
    );
  }

  /* ── Unified waiting state (no bookmarked contracts) ── */
  if (!hasItems) {
    return (
      <div className="dash-main">
        <WaitingState onRetry={() => { setLoading(true); setErrorCode(null); retryCountRef.current = 0; fetchPipeline(); }} />
      </div>
    );
  }

  /* ── Populated kanban (error banner shown inline if stale) ── */
  return (
    <motion.div
      className="dash-main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "var(--space-4)" }}
      >
        <div>
          <h1 style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--app-text)", margin: 0, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 10 }}>
            <LayoutList size={22} color="var(--accent)" aria-hidden="true" />
            Your Pipeline
          </h1>
          <p style={{ color: "var(--app-muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <ArrowUpDown size={12} style={{ color: "var(--app-faint)" }} aria-hidden="true" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: "4px 8px", borderRadius: 6, border: "1px solid var(--app-border)",
              fontSize: "0.72rem", color: "var(--app-text)", background: "var(--app-surface)",
              cursor: "pointer", fontWeight: 500,
            }}
            aria-label="Sort pipeline by"
          >
            <option value="updated">Last Updated</option>
            <option value="score">Match Score</option>
            <option value="deadline">Deadline</option>
            <option value="value">Value</option>
          </select>
        </div>
      </motion.div>

      {/* First-session hint */}
      {firstSession && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            padding: "10px 14px", marginBottom: "var(--space-4)",
            background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
            borderRadius: 8, fontSize: "0.8rem", color: "var(--accent)",
          }}
        >
          Click any card to review it, add research notes, then advance it to the next stage. Your pipeline tracks every step from qualifying to award.
        </motion.div>
      )}

      {/* Recoverable error banner (cached data still shown) */}
      {errorCode !== null && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: "8px 14px", marginBottom: "var(--space-4)",
            background: "var(--danger-subtle)", border: "1px solid var(--danger-border)",
            borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
            fontSize: "0.8rem", color: "var(--danger)",
          }}
        >
          <XCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span style={{ flex: 1 }}>
            Could not refresh {errorCode !== 0 ? `(${errorCode})` : ""}. Showing previously loaded data.{" "}
            <button
              onClick={() => { setErrorCode(null); retryCountRef.current = 0; fetchPipeline(); }}
              style={{ color: "var(--danger)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
            >
              Retry
            </button>
          </span>
        </motion.div>
      )}

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: "var(--space-4)" }}
        >
          {diagnostics.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px", marginBottom: 6,
                background: "var(--app-surface)", border: "1px solid var(--app-border)",
                borderRadius: 6, fontSize: "0.75rem", color: "var(--app-muted)",
              }}
            >
              {msg}
            </div>
          ))}
        </motion.div>
      )}

      {/* Advance counter */}
      <AnimatePresence>
        {advanceCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "6px 12px", marginBottom: "var(--space-3)",
              background: "var(--success-subtle)", border: "1px solid var(--success-border)",
              borderRadius: 6, fontSize: "0.75rem", color: "var(--success)",
              fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            Advanced {advanceCount} {advanceCount === 1 ? "card" : "cards"} ·
            {scorecard?.active_pursuits && scorecard.active_pursuits > 0
              ? `${scorecard.active_pursuits} now in active pursuit`
              : "Pipeline updated"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scorecard */}
      {scorecard && <Scorecard data={scorecard} />}

      {/* Kanban columns */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        style={{
          display: "flex", gap: "var(--space-3)", overflowX: "auto",
          paddingBottom: "var(--space-4)",
          scrollbarWidth: "thin",
        }}
      >
        {sortedStages.map((col) => (
          <PipelineColumn
            key={col.stage}
            column={col}
            onStageChange={handleStageChange}
            onNotesUpdate={handleNotesUpdate}
            onUrlAdd={handleUrlAdd}
            onUrlRemove={handleUrlRemove}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
