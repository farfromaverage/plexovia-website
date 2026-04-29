"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, BarChart2, AlertCircle, Info, RefreshCw, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

/* ─── Types ─────────────────────────────────────────────── */
interface ChartPoint {
  period: string;
  historical?: number;
  projected?: number;
}
interface ForecastCard {
  id: string;
  naics_code: string;
  naics_label: string;
  forecast_type: string;
  prediction_type: "increase" | "decrease" | "stable";
  confidence: "high" | "medium" | "low";
  percent_change: number;
  insight_text: string;
  data_points: ChartPoint[];
  generated_at: string | null;
  run_date: string | null;
}
interface ForecastResponse {
  forecasts: ForecastCard[];
  generated_at: string | null;
  model: string;
  status: string;
}

/* ─── Tab Configuration ──────────────────────────────────── */
const TABS = [
  { key: "renewal_radar",          label: "Renewal Radar",         short: "Renewal Radar" },
  { key: "budget_heatmap",         label: "Spending Heatmaps",     short: "Spending" },
  { key: "sub_trickle",            label: "Trickle-Down",          short: "Sub-Trickle" },
  { key: "incumbent_vulnerability",label: "Incumbent Vulnerability",short: "Incumbents" },
  { key: "setaside_depletion",     label: "Set-Aside Depletion",   short: "Set-Aside" },
  { key: "zero_competition",       label: "Zero-Competition",      short: "Zero-Comp" },
  { key: "micro_purchase_surge",   label: "Micro-Purchase Surge",  short: "Micro-Purchase" },
] as const;

/* ─── Helpers ────────────────────────────────────────────── */
function confidenceMeta(c: string) {
  if (c === "high")   return { label: "High confidence",   color: "#4ADE80", bg: "rgba(74,222,128,0.1)"  };
  if (c === "medium") return { label: "Medium confidence", color: "var(--accent)", bg: "rgba(201,168,76,0.1)" };
  return               { label: "Low confidence",  color: "var(--app-muted)", bg: "var(--app-surface-2)" };
}

function formatLastUpdated(runDate: string | null): { text: string; isStale: boolean } {
  if (!runDate) return { text: "Not yet updated", isStale: true };
  const days = Math.floor((Date.now() - new Date(runDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return { text: "Updated today", isStale: false };
  if (days === 1) return { text: "Updated yesterday", isStale: false };
  if (days <= 7)  return { text: `Updated ${days} days ago`, isStale: false };
  const dateStr = new Date(runDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { text: `Updated ${dateStr} — may be outdated`, isStale: true };
}

/* ─── Skeleton ───────────────────────────────────────────── */
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

/* ─── Per-Type Chart Renderers ───────────────────────────── */
function RenewalRadarChart({ cards }: { cards: ForecastCard[] }) {
  // Vertical timeline list — sorted by soonest recompete (peak month)
  const sorted = [...cards].sort((a, b) => (b.percent_change || 0) - (a.percent_change || 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {sorted.map(card => {
        const cm = confidenceMeta(card.confidence);
        const peak = card.data_points.find(d => d.projected !== undefined);
        return (
          <div key={card.id} className="dash-card-padded" style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.875rem 1rem" }}>
            <div style={{ width: 4, height: 40, borderRadius: 2, background: cm.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)" }}>{card.naics_label}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--app-muted)", marginTop: 2 }}>
                {card.insight_text || "No pattern detected"}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {peak && <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--app-text)" }}>{peak.period}</div>}
              <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 999, background: cm.bg, color: cm.color, border: `1px solid ${cm.color}30` }}>{cm.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeatmapChart({ cards }: { cards: ForecastCard[] }) {
  // Grid heatmap — rows=agencies, cols=months, color=intensity
  if (!cards.length) return null;
  const allMonths = [...new Set(cards.flatMap(c => c.data_points.filter(d => d.projected !== undefined).map(d => d.period)))];
  const maxVal = Math.max(...cards.flatMap(c => c.data_points.map(d => d.projected || 0)), 1);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--app-muted)", fontWeight: 600, borderBottom: "1px solid var(--app-border)" }}>Agency</th>
            {allMonths.slice(0, 6).map(m => (
              <th key={m} style={{ padding: "6px 4px", color: "var(--app-muted)", fontWeight: 500, borderBottom: "1px solid var(--app-border)", textAlign: "center" }}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cards.slice(0, 15).map(card => (
            <tr key={card.id}>
              <td style={{ padding: "5px 8px", color: "var(--app-text)", fontSize: "0.7rem", borderBottom: "1px solid var(--app-border)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {card.naics_label}
              </td>
              {allMonths.slice(0, 6).map(m => {
                const dp = card.data_points.find(d => d.period === m);
                const val = dp?.projected || 0;
                const intensity = Math.min(1, val / maxVal);
                return (
                  <td key={m} style={{ padding: "4px", textAlign: "center", borderBottom: "1px solid var(--app-border)" }}>
                    <div title={`${val.toFixed(0)}`} style={{
                      width: "100%", minWidth: 28, height: 24, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                      background: intensity > 0 ? `rgba(201, 168, 76, ${0.1 + intensity * 0.6})` : "var(--app-surface-2)",
                      fontSize: "0.65rem", color: intensity > 0.5 ? "var(--app-text)" : "var(--app-faint)",
                    }}>{val > 0 ? val.toFixed(0) : ""}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HorizontalBarChart({ cards }: { cards: ForecastCard[] }) {
  // Used for Incumbent Vulnerability — horizontal bars showing % vulnerability
  const data = cards.slice(0, 12).map(c => ({
    name: c.naics_label.length > 25 ? c.naics_label.slice(0, 22) + "…" : c.naics_label,
    value: Math.abs(c.percent_change),
    full: c.naics_label,
  })).sort((a, b) => b.value - a.value);
  
  return (
    <div style={{ height: Math.max(200, data.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--app-faint)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--app-muted)" }} axisLine={false} tickLine={false} width={150} />
          <Tooltip contentStyle={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 11 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, "Vulnerability"] as [string, string]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, idx) => (
              <Cell key={idx} fill={d.value > 70 ? "#F87171" : d.value > 40 ? "var(--accent)" : "#4ADE80"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CardListView({ cards }: { cards: ForecastCard[] }) {
  // Card list — for Zero-Competition, sorted by relevance
  const sorted = [...cards].sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
      {sorted.map(card => {
        const cm = confidenceMeta(card.confidence);
        return (
          <div key={card.id} className="dash-card-padded" style={{ padding: "0.875rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="dash-tag dash-tag-muted dash-mono" style={{ fontSize: "0.65rem" }}>NAICS {card.naics_code}</span>
              <span style={{ fontSize: "0.6rem", padding: "2px 6px", borderRadius: 999, background: cm.bg, color: cm.color }}>{cm.label}</span>
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 6 }}>{card.naics_label}</div>
            <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0, lineHeight: 1.5 }}>{card.insight_text}</p>
          </div>
        );
      })}
    </div>
  );
}

function StandardBarChart({ cards }: { cards: ForecastCard[] }) {
  // Default grouped bar chart with historical + projected
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
      {cards.map(card => {
        const cm = confidenceMeta(card.confidence);
        const trend = card.prediction_type;
        const TrendIcon = trend === "increase" ? TrendingUp : trend === "decrease" ? TrendingDown : Minus;
        const trendColor = trend === "increase" ? "#4ADE80" : trend === "decrease" ? "#F87171" : "var(--app-muted)";
        return (
          <div key={card.id} className="dash-card-padded" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="dash-tag dash-tag-muted dash-mono" style={{ fontSize: "0.65rem" }}>NAICS {card.naics_code}</span>
                <h3 style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--app-text)", margin: "4px 0 0" }}>{card.naics_label}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: trendColor, fontWeight: 700, fontSize: "1.1rem" }}>
                  <TrendIcon size={14} /> {Math.abs(card.percent_change).toFixed(0)}%
                </div>
                <span style={{ fontSize: "0.6rem", padding: "2px 6px", borderRadius: 999, background: cm.bg, color: cm.color }}>{cm.label}</span>
              </div>
            </div>
            {card.data_points.length > 0 ? (
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={card.data_points} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
                    <XAxis dataKey="period" tick={{ fontSize: 9, fill: "var(--app-faint)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--app-faint)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 11 }} />
                    {card.data_points.some(d => d.historical !== undefined) && (
                      <Bar dataKey="historical" fill="var(--app-muted)" name="Historical" radius={[3,3,0,0]} />
                    )}
                    {card.data_points.some(d => d.projected !== undefined) && (
                      <Bar dataKey="projected" fill="var(--accent)" name="Projected" radius={[3,3,0,0]} opacity={0.75} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--app-faint)", fontSize: "0.75rem" }}>
                Insufficient data to render chart
              </div>
            )}
            {card.insight_text && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Info size={11} color="var(--app-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0, lineHeight: 1.5 }}>{card.insight_text}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Chart Dispatcher ───────────────────────────────────── */
function renderTabContent(tabKey: string, cards: ForecastCard[]) {
  if (cards.length === 0) {
    return (
      <div className="dash-card-padded" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <BarChart2 size={28} color="var(--app-faint)" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 6 }}>
          No forecasting data available for this prediction
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--app-muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
          Not enough historical award data in USASpending.gov to generate this prediction.
          This requires at least 18 months of USASpending records for your NAICS codes.
          Check back weekly — data accumulates as new awards are recorded.
        </p>
      </div>
    );
  }

  switch (tabKey) {
    case "renewal_radar": return <RenewalRadarChart cards={cards} />;
    case "budget_heatmap": return <HeatmapChart cards={cards} />;
    case "sub_trickle": return <StandardBarChart cards={cards} />;
    case "incumbent_vulnerability": return <HorizontalBarChart cards={cards} />;
    case "setaside_depletion": return <StandardBarChart cards={cards} />;
    case "zero_competition": return <CardListView cards={cards} />;
    case "micro_purchase_surge": return <HeatmapChart cards={cards} />;
    default: return <StandardBarChart cards={cards} />;
  }
}

import { supabase } from "@/lib/supabase";

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
      const { data: p } = await supabase.from('profiles').select('naics_codes').single();
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
        
        // Start polling
        const interval = setInterval(async () => {
          try {
            const pollRes = await fetch("/api/forecasts");
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status !== "generating") {
                setData(pollData);
                setIsColdStart(false);
                clearInterval(interval);
              }
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 30_000); // Poll every 30s instead of 60s
        setTimeout(() => clearInterval(interval), 1800_000); // 30 min max

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

  useEffect(() => { 
    if (userNaicsCodes.length > 0) load(); 
  }, [userNaicsCodes]);

  const forecasts = data?.forecasts ?? [];
  const isLive = forecasts.length > 0;
  const runDate = forecasts[0]?.run_date ?? data?.generated_at ?? null;
  const lastUpdated = formatLastUpdated(runDate);

  // Group forecasts by forecast_type for tab filtering
  const byType = new Map<string, ForecastCard[]>();
  for (const f of forecasts) {
    const key = f.forecast_type || "unknown";
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(f);
  }

  const tabCards = byType.get(activeTab) ?? [];

  // Check if ALL predictions are LOW confidence
  const allLow = isLive && forecasts.every(f => f.confidence === "low");
  const userNaics = [...new Set(forecasts.map(f => f.naics_code))];

  return (
    <div className="dash-main">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">AI Forecasts</h1>
          <p className="dash-page-sub" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
              borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
              background: isLive ? "rgba(74,222,128,0.1)" : "var(--app-surface-2)",
              border: `1px solid ${isLive ? "rgba(74,222,128,0.25)" : "var(--app-border)"}`,
              color: isLive ? "#4ADE80" : "var(--app-muted)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
              {isLive ? "TimesFM Intelligence Active" : "Waiting for data"}
            </span>
            {/* Stale data warning (GAP 8) */}
            {runDate && (
              <span style={{ fontSize: "0.75rem", color: lastUpdated.isStale ? "var(--accent)" : "var(--app-faint)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} />
                {lastUpdated.text}
              </span>
            )}
          </p>
        </div>
        <button className="dash-btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* LOW confidence banner (GAP 7) */}
      {allLow && (
        <div style={{
          padding: "0.875rem 1rem", marginBottom: "1rem", borderRadius: 10,
          background: "var(--app-surface)", border: "1px solid var(--app-border)",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 4 }}>
              ℹ️ Limited historical data for your NAICS codes
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0, lineHeight: 1.5 }}>
              Your NAICS codes ({userNaics.join(", ")}) have fewer than 18 months of federal award history
              in USASpending.gov. All predictions are LOW confidence. Results will improve as
              USASpending accumulates more data for these categories.
              Predictions with LOW confidence are still directionally correct — they indicate trends, not precise values.
            </p>
          </div>
        </div>
      )}

      {/* Confidence legend */}
      <div style={{
        display: "flex", gap: "1.5rem", flexWrap: "wrap", padding: "0.75rem 1rem",
        background: "var(--app-surface)", border: "1px solid var(--app-border)",
        borderRadius: 10, marginBottom: "1rem", alignItems: "center",
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--app-faint)", fontWeight: 600 }}>Confidence levels:</span>
        {[
          { dot: "#4ADE80", label: "High: 36+ months of data" },
          { dot: "var(--accent)", label: "Medium: 18–35 months" },
          { dot: "var(--app-muted)", label: "Low: <18 months" },
        ].map(({ dot, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--app-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>

      {/* 7-Tab Navigation (GAP 4) */}
      {!loading && !error && isLive && (
        <div style={{
          display: "flex", gap: 0, overflowX: "auto", marginBottom: "1.25rem",
          borderBottom: "1px solid var(--app-border)", WebkitOverflowScrolling: "touch",
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = byType.get(tab.key)?.length ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 16px", fontSize: "0.78rem", fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--accent)" : "var(--app-muted)",
                  background: "transparent", border: "none", cursor: "pointer",
                  borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  whiteSpace: "nowrap", transition: "all 0.15s ease",
                }}
              >
                <span className="tab-full">{tab.label}</span>
                {count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: "0.65rem", opacity: 0.6 }}>({count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isColdStart ? (
        <div className="dash-card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
          <RefreshCw size={36} className="spin" style={{ color: "var(--accent)", margin: "0 auto 1.5rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 8 }}>
            Generating your AI forecasts for the first time.
          </h2>
          <p style={{ color: "var(--app-muted)", marginBottom: "2rem" }}>This takes 3–8 minutes.</p>
          
          <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "left", background: "var(--app-surface-2)", padding: "1.5rem", borderRadius: 12, border: "1px solid var(--app-border)" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--app-muted)", marginBottom: "1rem" }}>
              <strong style={{ color: "var(--app-text)" }}>NAICS codes being analysed:</strong> {userNaicsCodes.join(', ')}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--app-text)", fontWeight: 600, marginBottom: "0.75rem" }}>
              Predictions being built:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem", color: "var(--app-muted)" }}>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> The Renewal Radar</li>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> Use-it-or-Lose-it Spending Heatmaps</li>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> Subcontractor Trickle-Down Forecaster</li>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> The Incumbent Vulnerability Score</li>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> Set-Aside Depletion Forecaster</li>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> Zero-Competition Forecasts</li>
              <li><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span> The Micro-Purchase Surge Radar</li>
            </ul>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--app-faint)", marginTop: "2rem" }}>
            This page will update automatically when ready.
          </p>
        </div>
      ) : loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {[1, 2, 3].map(i => <ForecastSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="dash-card">
          <ErrorState message={`Failed to load forecasts: ${error}`} onRetry={load} />
        </div>
      ) : !isLive ? (
        <div className="dash-card">
          <EmptyState
            icon={<BarChart2 size={28} />}
            title="No forecasts yet"
            message="The AI engine generates forecasts based on your NAICS codes. Add NAICS codes to your profile, then check back after the next weekly run."
            action={
              <a href="/dashboard/profile" className="dash-btn dash-btn-accent" style={{ textDecoration: "none", padding: "8px 16px" }}>
                Set up NAICS codes →
              </a>
            }
          />
        </div>
      ) : (
        renderTabContent(activeTab, tabCards)
      )}

      {/* Disclaimer */}
      {!loading && !error && isLive && (
        <div style={{ marginTop: "2rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={13} color="var(--app-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", margin: 0, lineHeight: 1.5 }}>
            Forecasts are generated by Google TimesFM trained on federal contract award history.
            They indicate probability trends, not guaranteed outcomes. Always verify with official SAM.gov data.
          </p>
        </div>
      )}
    </div>
  );
}
