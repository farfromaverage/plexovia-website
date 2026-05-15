"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart2, AlertCircle, Info, RefreshCw, Clock } from "lucide-react";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { supabase } from "@/lib/supabase";
import {
  RenewalRadarChart, SpendingHeatmapChart, SubTrickleGantt,
  IncumbentVulnerabilityChart, SetAsideDepletionChart,
  ZeroCompetitionCards, MicroPurchaseSurgeChart,
  type ForecastCard,
} from "./ForecastCharts";

/* ─── Types ─────────────────────────────────────────────── */
interface ForecastResponse {
  forecasts: ForecastCard[];
  generated_at: string | null;
  model: string;
  status: string;
}

/* ─── Tab Configuration ──────────────────────────────────── */
const TABS = [
  { key: "renewal_radar",           label: "Renewal Radar" },
  { key: "budget_heatmap",          label: "Spending Heatmaps" },
  { key: "sub_trickle",             label: "Trickle-Down" },
  { key: "incumbent_vulnerability", label: "Incumbent Vulnerability" },
  { key: "setaside_depletion",      label: "Set-Aside Depletion" },
  { key: "zero_competition",        label: "Zero-Competition" },
  { key: "micro_purchase_surge",    label: "Micro-Purchase Surge" },
] as const;

/* ─── Helpers ────────────────────────────────────────────── */
function formatLastUpdated(runDate: string | null): { text: string; isStale: boolean } {
  if (!runDate) return { text: "Not yet updated", isStale: true };
  const days = Math.floor((Date.now() - new Date(runDate).getTime()) / 86400000);
  if (days === 0) return { text: "Updated today", isStale: false };
  if (days === 1) return { text: "Updated yesterday", isStale: false };
  if (days <= 7)  return { text: `Updated ${days} days ago`, isStale: false };
  return { text: `Updated ${new Date(runDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — may be outdated`, isStale: true };
}

function ForecastSkeleton() {
  return (
    <div className="dash-card-padded" aria-busy="true">
      <div className="dash-skeleton" style={{ height: 14, width: "30%", marginBottom: 10 }} />
      <div className="dash-skeleton" style={{ height: 22, width: "50%", marginBottom: 16 }} />
      <div className="dash-skeleton" style={{ height: 140, borderRadius: 8, marginBottom: 12 }} />
      <div className="dash-skeleton" style={{ height: 12, width: "80%" }} />
    </div>
  );
}

/* ─── Chart Dispatcher ───────────────────────────────────── */
function renderTabContent(tabKey: string, cards: ForecastCard[]) {
  if (cards.length === 0) {
    return (
      <div className="dash-card-padded" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <BarChart2 size={28} style={{ color: "var(--app-faint)", margin: "0 auto 12px" }} />
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 6 }}>
          No forecasting data available for this prediction
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--app-muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
          Not enough historical award data in USASpending.gov to generate this prediction.
          This requires at least 18 months of records for your NAICS codes.
        </p>
      </div>
    );
  }
  switch (tabKey) {
    case "renewal_radar": return <RenewalRadarChart cards={cards} />;
    case "budget_heatmap": return <SpendingHeatmapChart cards={cards} />;
    case "sub_trickle": return <SubTrickleGantt cards={cards} />;
    case "incumbent_vulnerability": return <IncumbentVulnerabilityChart cards={cards} />;
    case "setaside_depletion": return <SetAsideDepletionChart cards={cards} />;
    case "zero_competition": return <ZeroCompetitionCards cards={cards} />;
    case "micro_purchase_surge": return <MicroPurchaseSurgeChart cards={cards} />;
    default: return <SpendingHeatmapChart cards={cards} />;
  }
}

/* ─── Page ───────────────────────────────────────────────── */
export default function ForecastsPage() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isColdStart, setIsColdStart] = useState(false);
  const [userNaicsCodes, setUserNaicsCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("naics_codes").single();
      if (p?.naics_codes) setUserNaicsCodes(p.naics_codes);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!isColdStart) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forecasts");
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === "generating") {
        setIsColdStart(true);
        setData({ forecasts: [], generated_at: null, model: "TimesFM", status: "generating" });
        const interval = setInterval(async () => {
          try {
            const pollRes = await fetch("/api/forecasts");
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status !== "generating") { setData(pollData); setIsColdStart(false); clearInterval(interval); }
            }
          } catch { /* polling error — silent */ }
        }, 30_000);
        setTimeout(() => clearInterval(interval), 1800_000);
        return;
      }
      setData(json);
      setIsColdStart(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (!isColdStart) setLoading(false);
    }
  }, [userNaicsCodes, isColdStart]);

  useEffect(() => { if (userNaicsCodes.length > 0) load(); }, [userNaicsCodes]);

  const forecasts = data?.forecasts ?? [];
  const isLive = forecasts.length > 0;
  const runDate = forecasts[0]?.run_date ?? data?.generated_at ?? null;
  const lastUpdated = formatLastUpdated(runDate);

  const byType = new Map<string, ForecastCard[]>();
  for (const f of forecasts) {
    const key = f.forecast_type || "unknown";
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(f);
  }
  const tabCards = byType.get(activeTab) ?? [];
  const allLow = isLive && forecasts.every(f => f.confidence === "low");
  const userNaics = [...new Set(forecasts.map(f => f.naics_code))];

  return (
    <div className="dash-main dash-fade-in">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">AI Forecasts</h1>
          <p className="dash-page-sub" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
              borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
              background: isLive ? "var(--success-subtle)" : "var(--app-surface-2)",
              border: `1px solid ${isLive ? "rgba(26,119,66,0.2)" : "var(--app-border)"}`,
              color: isLive ? "var(--success)" : "var(--app-muted)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
              {isLive ? "TimesFM Intelligence Active" : "Waiting for data"}
            </span>
            {runDate && (
              <span style={{ fontSize: "0.75rem", color: lastUpdated.isStale ? "var(--warning)" : "var(--app-faint)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} aria-hidden="true" /> {lastUpdated.text}
              </span>
            )}
          </p>
        </div>
        <button className="dash-btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* LOW confidence banner */}
      {allLow && (
        <div style={{ padding: "0.875rem 1rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", background: "var(--app-surface)", border: "1px solid var(--app-border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 4 }}>Limited historical data for your NAICS codes</div>
            <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0, lineHeight: 1.5 }}>
              Your NAICS codes ({userNaics.join(", ")}) have fewer than 18 months of federal award history.
              All predictions are LOW confidence. Results will improve as data accumulates.
            </p>
          </div>
        </div>
      )}

      {/* Confidence legend */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", padding: "0.75rem 1rem", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: "var(--radius-md)", marginBottom: "1rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--app-faint)", fontWeight: 600 }}>Confidence levels:</span>
        {[
          { dot: "var(--success)", label: "High: 36+ months of data" },
          { dot: "var(--accent)", label: "Medium: 18–35 months" },
          { dot: "var(--app-muted)", label: "Low: <18 months" },
        ].map(({ dot, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--app-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} /> {label}
          </span>
        ))}
      </div>

      {/* Summary insight banner (Phase 6 requirement) */}
      {!loading && !error && isLive && (() => {
        const renewals = byType.get("renewal_radar")?.length || 0;
        const naicsCount = new Set(forecasts.map(f => f.naics_code)).size;
        const increasing = forecasts.filter(f => f.prediction_type === "increase").length;
        const allMonths = forecasts.flatMap(f => f.data_points.filter(d => d.projected !== undefined).map(d => d.period));
        const mCounts = new Map<string, number>();
        allMonths.forEach(m => mCounts.set(m, (mCounts.get(m) || 0) + 1));
        const peakMonth = [...mCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "upcoming months";
        const total = forecasts.length;

        if (total < 3) return (
          <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", background: "var(--app-surface)", border: "1px solid var(--app-border)", fontSize: "0.82rem", color: "var(--app-muted)" }}>
            Limited data available. Add more NAICS codes in your profile to improve predictions.
          </div>
        );

        return (
          <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", background: "var(--accent-subtle)", border: "1px solid var(--accent-border)", fontSize: "0.82rem", color: "var(--app-text)", lineHeight: 1.5 }}>
            <strong>Your intelligence summary:</strong> {renewals > 0 ? `${renewals} renewal${renewals !== 1 ? "s" : ""} predicted` : `${total} predictions available`} across {naicsCount} NAICS code{naicsCount !== 1 ? "s" : ""}.
            Highest activity expected around {peakMonth}. {increasing > 0 ? `${increasing} agenc${increasing !== 1 ? "ies" : "y"} showing spending increases.` : ""}
          </div>
        );
      })()}

      {/* Tab Navigation */}
      {!loading && !error && isLive && (
        <div className="dash-status-tabs" style={{ marginBottom: "var(--space-5)", overflowX: "auto" }}>
          {TABS.map(tab => {
            const count = byType.get(tab.key)?.length ?? 0;
            return (
              <button
                key={tab.key}
                className="dash-status-tab"
                data-active={activeTab === tab.key ? "true" : undefined}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count > 0 && <span className="dash-tab-count">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isColdStart ? (
        <div className="dash-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <RefreshCw size={36} className="spin" style={{ color: "var(--accent)", margin: "0 auto 1.5rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 8 }}>Generating your AI forecasts for the first time.</h2>
          <p style={{ color: "var(--app-muted)", marginBottom: "2rem" }}>This takes 3–8 minutes.</p>
          <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "left", background: "var(--app-surface-2)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--app-border)" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--app-muted)", marginBottom: "1rem" }}>
              <strong style={{ color: "var(--app-text)" }}>NAICS codes being analysed:</strong> {userNaicsCodes.join(", ")}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--app-text)", fontWeight: 600, marginBottom: "0.75rem" }}>Predictions being built:</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem", color: "var(--app-muted)" }}>
              {TABS.map(t => <li key={t.key}><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span>{t.label}</li>)}
            </ul>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--app-faint)", marginTop: "2rem" }}>This page will update automatically when ready.</p>
        </div>
      ) : loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {[1, 2, 3].map(i => <ForecastSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="dash-card"><ErrorState message={`Failed to load forecasts: ${error}`} onRetry={load} /></div>
      ) : !isLive ? (
        <div className="dash-card">
          <EmptyState icon={<BarChart2 size={28} />} title="No forecasts yet" message="The AI engine generates forecasts based on your NAICS codes. Add NAICS codes to your profile, then check back after the next weekly run."
            action={<a href="/dashboard/profile" className="dash-btn dash-btn-accent" style={{ textDecoration: "none", padding: "8px 16px" }}>Set up NAICS codes →</a>} />
        </div>
      ) : (
        renderTabContent(activeTab, tabCards)
      )}

      {/* Disclaimer */}
      {!loading && !error && isLive && (
        <div style={{ marginTop: "2rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={13} style={{ color: "var(--app-faint)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", margin: 0, lineHeight: 1.5 }}>
            Forecasts are generated by Google TimesFM trained on federal contract award history.
            They indicate probability trends, not guaranteed outcomes. Always verify with official SAM.gov data.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
}
