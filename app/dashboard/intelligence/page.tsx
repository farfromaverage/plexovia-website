"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Brain, AlertTriangle, TrendingUp, Target,
  Shield, Zap, Clock, ChevronDown, ChevronUp,
  RefreshCw, ArrowUpRight, BarChart3,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────── */
interface Prediction {
  naics_code: string;
  agency_name: string;
  win_probability: number;
  model_version: string;
  scored_at: string;
}

interface BriefingSection {
  count: number;
  items: unknown[];
  narrative: string;
  high_confidence?: number;
  agencies_tracked?: number;
  high_probability?: number;
  avg_probability?: number;
  model_version?: string;
}

interface Briefing {
  headline: string;
  forecasts: BriefingSection;
  win_probability: BriefingSection;
}

/* ─── Component ──────────────────────────────────────────────────── */
export default function WinAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>("win_probability");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    try {
      // Fetch data in parallel
      const [intelRes, winProbRes] = await Promise.allSettled([
        fetch("/api/intel"),
        fetch("/api/win-prob?limit=50"),
      ]);

      // Parse intel briefing
      if (intelRes.status === "fulfilled" && intelRes.value.ok) {
        const data = await intelRes.value.json();
        setBriefing(data.briefing);
      }

      // Parse win probability
      if (winProbRes.status === "fulfilled" && winProbRes.value.ok) {
        const data = await winProbRes.value.json();
        setPredictions(data.predictions || []);
      }

    } catch (e) {
      setError("Failed to load win analysis data. The engine may be starting up.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleSection(section: string) {
    setExpandedSection(prev => prev === section ? null : section);
  }

  if (loading) {
    return (
      <div className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <RefreshCw size={18} style={{ color: "var(--app-muted)", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "var(--app-muted)", fontSize: "0.9rem" }}>Loading win analysis…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dash-main" style={{ maxWidth: 1000 }}>

      {/* Page Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={22} style={{ color: "var(--accent)" }} />
            Win Analysis
          </h1>
          <p className="dash-page-sub">
            AI-driven forecasts and win probability analysis for your NAICS codes.
          </p>
        </div>
        <button
          className="dash-btn dash-btn-primary"
          onClick={loadData}
          style={{ padding: "0.5rem 1rem", gap: 6, fontSize: "0.8rem" }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="dash-alert-warning" style={{ marginBottom: "1.25rem" }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* ── Headline Banner ── */}
      {briefing && (
        <div style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          marginBottom: "1.25rem",
        }}>
          <p style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}>
            {briefing.headline}
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {briefing.forecasts?.count > 0 && (
              <span style={statPill}>
                <TrendingUp size={12} /> {briefing.forecasts.count} forecasts
              </span>
            )}
            {briefing.win_probability?.count > 0 && (
              <span style={statPill}>
                <Target size={12} /> {briefing.win_probability.count} predictions
              </span>
            )}
            {(!briefing.forecasts?.count && !briefing.win_probability?.count) && (
              <span style={{ fontSize: "0.85rem", color: "var(--app-muted)" }}>
                Win Analysis data will populate as the engine collects contract lifecycle data.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Win Probability Section ── */}
      <CollapsibleSection
        title="Win Probability"
        icon={<Target size={16} />}
        count={predictions.length}
        expanded={expandedSection === "win_probability"}
        onToggle={() => toggleSection("win_probability")}
        narrative={briefing?.win_probability?.narrative}
      >
        {predictions.length === 0 ? (
          <EmptyState message="Win probability model has not been trained yet. Training runs automatically every Sunday." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {predictions.slice(0, 15).map((pred, i) => {
              const prob = Math.round(pred.win_probability * 100);
              const barColor = prob >= 60 ? "#4ADE80" : prob >= 40 ? "#C9A84C" : "var(--app-muted)";

              return (
                <div
                  key={`${pred.naics_code}-${pred.agency_name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: "var(--app-surface)",
                    border: "1px solid var(--app-border)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: 2 }}>
                      {pred.agency_name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", fontFamily: "var(--font-geist-mono, monospace)" }}>
                      NAICS {pred.naics_code}
                    </p>
                  </div>

                  {/* Probability bar */}
                  <div style={{ width: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: barColor }}>
                      {prob}%
                    </span>
                    <div style={{
                      width: "100%", height: 4, borderRadius: 2,
                      background: "var(--app-surface-2)",
                    }}>
                      <div style={{
                        width: `${prob}%`, height: "100%", borderRadius: 2,
                        background: barColor,
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* ── Forecasts Section ── */}
      <CollapsibleSection
        title="AI Forecasts"
        icon={<TrendingUp size={16} />}
        count={briefing?.forecasts?.count || 0}
        expanded={expandedSection === "forecasts"}
        onToggle={() => toggleSection("forecasts")}
        narrative={briefing?.forecasts?.narrative}
      >
        {!briefing?.forecasts?.count ? (
          <EmptyState message="Forecasts generate after the engine accumulates enough historical data. This typically takes 2-3 pipeline cycles." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <StatCard label="Active Forecasts" value={String(briefing.forecasts.count)} />
            <StatCard label="High Confidence (≥70%)" value={String(briefing.forecasts.high_confidence || 0)} />
            <StatCard label="Agencies Tracked" value={String(briefing.forecasts.agencies_tracked || 0)} />
          </div>
        )}
      </CollapsibleSection>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Subcomponents ───────────────────────────────────────────────── */

const statPill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontSize: "0.8rem", fontWeight: 500, color: "var(--app-muted)",
  background: "var(--app-surface-2)", border: "1px solid var(--app-border)",
  borderRadius: 999, padding: "3px 10px",
};

function CollapsibleSection({
  title, icon, count, expanded, onToggle, narrative, children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  narrative?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--app-surface)",
      border: "1px solid var(--app-border)",
      borderRadius: "var(--radius-md)",
      marginBottom: "1rem",
      overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          width: "100%", padding: "1rem 1.25rem",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit",
        }}
      >
        <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
        <span style={{ flex: 1, fontSize: "0.9375rem", fontWeight: 600 }}>{title}</span>
        <span style={{
          fontSize: "0.75rem", fontWeight: 600, color: "var(--app-muted)",
          background: "var(--app-surface-2)", borderRadius: 999,
          padding: "2px 8px", minWidth: 28, textAlign: "center",
        }}>
          {count}
        </span>
        {expanded
          ? <ChevronUp size={16} style={{ color: "var(--app-muted)" }} />
          : <ChevronDown size={16} style={{ color: "var(--app-muted)" }} />
        }
      </button>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          {narrative && (
            <p style={{
              fontSize: "0.825rem", color: "var(--app-muted)",
              lineHeight: 1.6, marginBottom: "1rem",
              padding: "0.625rem 0.875rem",
              background: "var(--app-surface-2)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--app-border)",
            }}>
              {narrative}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "1rem",
      background: "var(--app-surface-2)",
      border: "1px solid var(--app-border)",
      borderRadius: "var(--radius-sm)",
      textAlign: "center",
    }}>
      <p style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 2 }}>
        {value}
      </p>
      <p style={{ fontSize: "0.75rem", color: "var(--app-muted)" }}>{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: "2rem",
      textAlign: "center",
      color: "var(--app-muted)",
      fontSize: "0.85rem",
      lineHeight: 1.6,
    }}>
      <Shield size={24} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
      <p>{message}</p>
    </div>
  );
}
