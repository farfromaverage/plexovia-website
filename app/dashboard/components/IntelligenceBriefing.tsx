"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────── */
interface TopMatch {
  id: string; title: string; agency: string; score: number;
  deadline: string | null; url: string | null;
  naics_code: string | null; matched_at: string | null;
}

interface OverviewData {
  matchesCount: number;
  percentChange: number;
  avgScore: number;
  totalValue: number;
  topMatches: TopMatch[];
  setAsideBreakdown: Record<string, number>;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */
function deadlineDays(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function fmtDeadlineDays(days: number): string {
  if (days < 0)  return "Expired";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/* ─── Component ────────────────────────────────────────────────────── */
export default function IntelligenceBriefing({ newCount }: { newCount: number }) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const ovRes = await fetch("/api/overview?period=7");

        if (ovRes.ok && mounted) {
          const ovData: OverviewData = await ovRes.json();
          setOverview(ovData);
        }
      } catch {
        /* Network error — cards show empty state gracefully */
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  /* ── Derive urgent deadline ── */
  const urgentMatch = overview?.topMatches
    ?.filter(m => {
      const d = deadlineDays(m.deadline);
      return d !== null && d >= 0 && d <= 7;
    })
    .sort((a, b) => {
      // Highest score among urgent deadlines
      return b.score - a.score;
    })[0] ?? null;

  const urgentDays = urgentMatch ? deadlineDays(urgentMatch.deadline) : null;

  /* ── Today's date string ── */
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  if (loading) {
    return (
      <div className="dash-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="dash-skeleton" style={{ width: "60%", height: 20, borderRadius: 6, marginBottom: 12 }} />
        <div className="dash-skeleton" style={{ width: "40%", height: 14, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <section className="dash-card" style={{ padding: 0, marginBottom: "var(--space-6)", overflow: "hidden" }}>
      {/* Header bar */}
      <div style={{
        padding: "var(--space-4) var(--space-6)",
        borderBottom: "1px solid var(--app-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "var(--space-2)",
      }}>
        <div>
          <h2 style={{
            fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "var(--accent)", margin: 0,
          }}>
            Today&apos;s Intelligence
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", margin: "2px 0 0" }}>
            {today}
          </p>
        </div>
        {newCount > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 999,
            background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
            fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)",
          }}>
            {newCount} new since yesterday
          </span>
        )}
      </div>

      {/* One intelligence card */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr",
        gap: 0,
      }} className="dash-briefing-grid">

        {/* Card 1: Urgent Deadline */}
        <div style={{
          padding: "var(--space-5) var(--space-6)",
        }} className="dash-briefing-cell">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-3)" }}>
            {urgentMatch ? (
              <AlertTriangle size={15} style={{ color: "var(--warning)" }} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={15} style={{ color: "var(--success)" }} aria-hidden="true" />
            )}
            <span style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--app-faint)" }}>
              Urgent Deadline
            </span>
          </div>
          {urgentMatch ? (
            <>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {urgentMatch.title}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: "0 0 var(--space-2)" }}>
                {urgentMatch.agency}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 600,
                  color: urgentDays !== null && urgentDays <= 3 ? "var(--danger)" : "var(--warning)",
                }}>
                  {urgentDays !== null ? fmtDeadlineDays(urgentDays) : ""}
                </span>
                <span className="dash-mono" style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600 }}>
                  Score: {urgentMatch.score}%
                </span>
              </div>
              {urgentMatch.url && (
                <a
                  href={urgentMatch.url}
                  target="_blank" rel="noopener noreferrer"
                  className="dash-link-subtle"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "var(--space-3)", fontSize: "0.8125rem" }}
                >
                  View contract <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
            </>
          ) : (
            <>
              <p style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--app-text)", margin: "0 0 4px" }}>
                No urgent deadlines this week
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: 0 }}>
                All current opportunities have comfortable timelines.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Responsive override for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .dash-briefing-grid { grid-template-columns: 1fr !important; }
          .dash-briefing-cell { border-right: none !important; border-bottom: 1px solid var(--app-border); }
          .dash-briefing-cell:last-child { border-bottom: none; }
        }
      `}</style>
    </section>
  );
}
