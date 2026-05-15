"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, TrendingUp, CheckCircle2, Brain, ExternalLink, ArrowUpRight } from "lucide-react";

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

interface ForecastCard {
  forecast_type: string;
  naics_code: string | null;
  confidence: string;
  insight_text: string;
  projected_date: string | null;
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
  const [topForecast, setTopForecast] = useState<ForecastCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Gap 4 fix: explicitly fetch /api/overview (dashboard page doesn't fetch it)
        const [ovRes, fcRes] = await Promise.all([
          fetch("/api/overview?period=7"),
          fetch("/api/forecasts"),
        ]);

        if (ovRes.ok && mounted) {
          const ovData: OverviewData = await ovRes.json();
          setOverview(ovData);
        }

        if (fcRes.ok && mounted) {
          const fcData = await fcRes.json();
          const cards: ForecastCard[] = fcData.forecasts || [];
          // Pick highest-confidence card with soonest projected date
          const ranked = cards
            .filter(c => c.insight_text && c.confidence)
            .sort((a, b) => {
              const confOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
              const confDiff = (confOrder[b.confidence] || 0) - (confOrder[a.confidence] || 0);
              if (confDiff !== 0) return confDiff;
              // Tie-break by soonest projected date
              const dateA = a.projected_date ? new Date(a.projected_date).getTime() : Infinity;
              const dateB = b.projected_date ? new Date(b.projected_date).getTime() : Infinity;
              return dateA - dateB;
            });
          if (ranked.length > 0) setTopForecast(ranked[0]);
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

      {/* Two intelligence cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 0,
      }} className="dash-briefing-grid">

        {/* Card 1: Urgent Deadline */}
        <div style={{
          padding: "var(--space-5) var(--space-6)",
          borderRight: "1px solid var(--app-border)",
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

        {/* Card 2: Top Forecast Insight */}
        <div style={{
          padding: "var(--space-5) var(--space-6)",
        }} className="dash-briefing-cell">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--space-3)" }}>
            <Brain size={15} style={{ color: "var(--accent)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--app-faint)" }}>
              Top Forecast Insight
            </span>
          </div>
          {topForecast ? (
            <>
              <p style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--app-text)", margin: "0 0 4px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {topForecast.insight_text}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 999,
                  fontSize: "0.7rem", fontWeight: 600,
                  background: topForecast.confidence === "high" ? "var(--success-subtle)" : "var(--accent-subtle)",
                  color: topForecast.confidence === "high" ? "var(--success)" : "var(--accent)",
                  border: `1px solid ${topForecast.confidence === "high" ? "rgba(26,119,66,0.2)" : "var(--accent-border)"}`,
                }}>
                  <TrendingUp size={10} aria-hidden="true" />
                  {topForecast.confidence} confidence
                </span>
                {topForecast.naics_code && (
                  <span className="dash-mono" style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>
                    NAICS {topForecast.naics_code}
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/forecasts"
                className="dash-link-subtle"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "var(--space-3)", fontSize: "0.8125rem" }}
              >
                View forecasts <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--app-text)", margin: "0 0 4px" }}>
                Forecasts generating...
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--app-muted)", margin: 0 }}>
                Set up NAICS codes to enable AI predictions.
              </p>
              <Link
                href="/dashboard/profile"
                className="dash-link-subtle"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "var(--space-3)", fontSize: "0.8125rem" }}
              >
                Configure profile <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
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
