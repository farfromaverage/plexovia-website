"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { engineFetch } from "@/lib/engine";
import { LayoutList, XCircle, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PipelineColumn, { type PipelineItem } from "./PipelineColumn";
import type { StageColumn } from "./PipelineColumn";

/* ─── Scorecard Component ───────────────────────────────────── */
function Scorecard({ data }: { data: { total_tracked: number; active_pursuits: number; proposals_submitted: number; wins: number; not_awarded: number; no_bid: number; win_rate: number | null } }) {
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

/* ─── Page ──────────────────────────────────────────────────── */
export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<StageColumn[]>([]);
  const [scorecard, setScorecard] = useState<{
    total_tracked: number;
    active_pursuits: number;
    proposals_submitted: number;
    wins: number;
    not_awarded: number;
    no_bid: number;
    win_rate: number | null;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [firstSession, setFirstSession] = useState(false);
  const [advanceCount, setAdvanceCount] = useState(0);
  const [sortBy, setSortBy] = useState<"updated" | "score" | "deadline" | "value">("updated");

  /* ── Client-side sort — reorders items within each stage column ── */
  const sortedStages = stages.map((col) => {
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
      return 0; // "updated" — preserve API order (already sorted by pipeline_updated_at DESC)
    });
    return { ...col, items: sorted };
  });

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await engineFetch("/api/user/pipeline");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStages(json.stages || []);
      setScorecard(json.scorecard || null);
      setLastUpdated(json.last_updated || null);
      // First session detection: items in identified only, no items in any other stage
      const itemsInIdentified = (json.stages || []).find((s: StageColumn) => s.stage === "identified")?.items?.length || 0;
      const itemsInOther = (json.stages || []).filter((s: StageColumn) => s.stage !== "identified").reduce((a: number, s: StageColumn) => a + (s.items?.length || 0), 0);
      setFirstSession(itemsInIdentified > 0 && itemsInOther === 0);
      setError(false);
    } catch {
      setError(true);
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

  const handleStageChange = async (matchId: string, newStage: string) => {
    // Optimistic UI: move card immediately, then sync to backend
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
      await engineFetch(`/api/user/pipeline/${matchId}`, {
        method: "PATCH",
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      const res = await engineFetch("/api/user/pipeline");
      if (res.ok) {
        const json = await res.json();
        setScorecard(json.scorecard || null);
        setLastUpdated(json.last_updated || null);
      }
      setAdvanceCount((c) => c + 1);
      // Clear advance counter after 4 seconds
      setTimeout(() => setAdvanceCount(0), 4000);
    } catch {
      // Revert on failure — refetch full pipeline state
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
      await engineFetch(`/api/user/pipeline/${matchId}`, {
        method: "PATCH",
        body: JSON.stringify({ pipeline_notes: notes }),
      });
    } catch { /* revert on next fetch */ }
  };

  const handleUrlAdd = async (matchId: string, url: string) => {
    setStages((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.map((i) =>
          i.match_id === matchId
            ? { ...i, reference_urls: [...(i.reference_urls || []), url] }
            : i
        ),
      }))
    );
    const item = stages.flatMap((s) => s.items).find((i) => i.match_id === matchId);
    const newUrls = [...(item?.reference_urls || []), url];
    try {
      await engineFetch(`/api/user/pipeline/${matchId}`, {
        method: "PATCH",
        body: JSON.stringify({ reference_urls: newUrls }),
      });
    } catch { /* revert on next fetch */ }
  };

  const handleUrlRemove = async (matchId: string, url: string) => {
    setStages((prev) =>
      prev.map((col) => ({
        ...col,
        items: col.items.map((i) =>
          i.match_id === matchId
            ? { ...i, reference_urls: (i.reference_urls || []).filter((u) => u !== url) }
            : i
        ),
      }))
    );
    const item = stages.flatMap((s) => s.items).find((i) => i.match_id === matchId);
    const newUrls = (item?.reference_urls || []).filter((u) => u !== url);
    try {
      await engineFetch(`/api/user/pipeline/${matchId}`, {
        method: "PATCH",
        body: JSON.stringify({ reference_urls: newUrls }),
      });
    } catch { /* revert on next fetch */ }
  };

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 36, height: 36, border: "2.5px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "var(--space-4)" }} aria-label="Loading pipeline…" role="status" />
        <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--app-text)", margin: "0 0 4px" }}>
          Loading your pipeline…
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0 }}>
          Gathering contract matches, deadlines, and research notes
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <motion.div
      className="dash-main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
            Your Active Opportunities
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
        {/* Sort dropdown */}
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

      {/* First-session guided hint */}
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
          Click any card to review it, add research notes, then advance it to the next stage. Your pipeline tracks every step from discovery to award.
        </motion.div>
      )}

      {/* Advance counter — brief success feedback */}
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
            Advanced {advanceCount} {advanceCount === 1 ? "card" : "cards"} ·{" "}
            {scorecard?.active_pursuits && scorecard.active_pursuits > 0
              ? `${scorecard.active_pursuits} now in active pursuit`
              : "Pipeline updated"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scorecard */}
      {scorecard && <Scorecard data={scorecard} />}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: "10px var(--space-4)", marginBottom: "var(--space-4)", background: "var(--danger-subtle)", border: "1px solid var(--danger-border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}
        >
          <XCircle size={14} style={{ color: "var(--danger)" }} aria-hidden="true" />
          <span style={{ fontSize: "0.8125rem", color: "var(--danger)" }}>
            Could not load pipeline.{" "}
            <button onClick={fetchPipeline} style={{ color: "var(--danger)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>Retry</button>
          </span>
        </motion.div>
      )}

      {/* Kanban columns */}
      {stages.length > 0 ? (
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
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ padding: "3rem 0", textAlign: "center" }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <LayoutList size={20} style={{ color: "var(--accent)" }} aria-hidden="true" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--app-text)", margin: "0 0 0.25rem" }}>No opportunities in your pipeline yet</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", maxWidth: 300, margin: "0 auto" }}>
            Matched contracts from SAM.gov will appear here. Bookmark them to start tracking.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
