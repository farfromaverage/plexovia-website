"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, BarChart2, AlertCircle, ThumbsUp, ThumbsDown, TrendingUp, RefreshCw, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
  prediction_type: "increase" | "decrease" | "stable";
  confidence: "high" | "medium" | "low";
  percent_change: number;
  insight_text: string;
  data_points: ChartPoint[];
  generated_at: string | null;
}
interface ForecastResponse {
  forecasts: ForecastCard[];
  generated_at: string | null;
  model: string;
  status: string;
}

/* ─── Helpers ────────────────────────────────────────────── */
function confidenceMeta(c: string) {
  if (c === "high")   return { label: "High confidence",   color: "#4ADE80", bg: "rgba(74,222,128,0.1)"  };
  if (c === "medium") return { label: "Medium confidence", color: "var(--accent)", bg: "rgba(201,168,76,0.1)" };
  return               { label: "Low confidence",  color: "var(--app-muted)", bg: "var(--app-surface-2)" };
}
function predictionMeta(p: string) {
  if (p === "increase") return { icon: "↑", color: "#4ADE80", label: "Increasing" };
  if (p === "decrease") return { icon: "↓", color: "#F87171", label: "Decreasing" };
  return                        { icon: "→", color: "var(--app-muted)", label: "Stable" };
}
function parseInsight(text: string | null | undefined): string {
  if (!text) return "";
  // Handle both " || " separator and direct JSON strings
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "string") return parsed.split(" || ")[0].trim();
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
  } catch {
    // Not JSON — treat as plain string
    return text.split(" || ")[0].trim();
  }
  return text.split(" || ")[0].trim();
}

/* ─── Skeleton card ──────────────────────────────────────── */
function ForecastSkeleton() {
  return (
    <div className="dash-card-padded" aria-label="Loading forecast" aria-busy="true">
      <div className="dash-skeleton" style={{ height: 14, width: "30%", marginBottom: 10 }} />
      <div className="dash-skeleton" style={{ height: 22, width: "50%", marginBottom: 16 }} />
      <div className="dash-skeleton" style={{ height: 120, borderRadius: 8, marginBottom: 12 }} />
      <div className="dash-skeleton" style={{ height: 12, width: "80%" }} />
    </div>
  );
}

/* ─── Forecast card ──────────────────────────────────────── */
function ForecastCard({ card }: { card: ForecastCard }) {
  const cm = confidenceMeta(card.confidence);
  const pm = predictionMeta(card.prediction_type);
  const insight = parseInsight(card.insight_text);
  const [feedback, setFeedback] = useState<"up"|"down"|null>(null);

  return (
    <div className="dash-card-padded" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: 4 }}>
            <span className="dash-tag dash-tag-muted dash-mono" style={{ fontSize: "0.7rem", padding: "2px 7px" }}>
              NAICS {card.naics_code}
            </span>
            {/* Confidence badge */}
            <span
              title={cm.label}
              aria-label={cm.label}
              style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "2px 8px", borderRadius: 999,
                fontSize: "0.65rem", fontWeight: 600, color: cm.color,
                background: cm.bg, border: `1px solid ${cm.color}30`,
              }}
            >
              <span aria-hidden="true">{card.confidence === "high" ? "●" : card.confidence === "medium" ? "◉" : "○"}</span>
              {cm.label}
            </span>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--app-text)", margin: "2px 0 0", lineHeight: 1.3 }}>
            {card.naics_label}
          </h3>
        </div>

        {/* Trend indicator */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: pm.color, lineHeight: 1 }}>
            {pm.icon} {Math.abs(card.percent_change).toFixed(0)}%
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--app-muted)" }}>{pm.label}</div>
        </div>
      </div>

      {/* Chart */}
      {card.data_points.length > 0 ? (
        <div aria-label={`Forecast chart for NAICS ${card.naics_code}`} style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={card.data_points} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--app-faint)" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--app-faint)" }}
                axisLine={false} tickLine={false}
                label={{ value: "Contracts", angle: -90, position: "insideLeft", offset: 30, fontSize: 9, fill: "var(--app-faint)" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "var(--app-surface-2)", border: "1px solid var(--app-border)",
                  borderRadius: 8, fontSize: 11, color: "var(--app-text)",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [
                  typeof value === "number" ? value.toFixed(0) : String(value ?? ""),
                  name === "historical" ? "Historical (actual)" : "Projected (AI forecast)",
                ] as [string, string]}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "var(--app-muted)" }}
                formatter={(v) => v === "historical" ? "Historical" : "Projected"}
              />
              {card.data_points.some(d => d.historical !== undefined) && (
                <Bar dataKey="historical" fill="var(--app-muted)"    name="historical" radius={[3,3,0,0]} />
              )}
              {card.data_points.some(d => d.projected !== undefined) && (
                <Bar dataKey="projected"  fill="var(--accent)"       name="projected"  radius={[3,3,0,0]} opacity={0.75} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--app-faint)", fontSize: "0.8rem" }}>
          Insufficient data to render chart
        </div>
      )}

      {/* Insight */}
      {insight && (
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <Info size={12} color="var(--app-faint)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <p style={{ fontSize: "0.8rem", color: "var(--app-muted)", margin: 0, lineHeight: 1.5 }}>
            {insight}
          </p>
        </div>
      )}

      {/* Feedback */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "0.5rem", borderTop: "1px solid var(--app-border)" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--app-faint)", flex: 1 }}>
          {feedback === "up" ? "Thanks for your feedback!" : feedback === "down" ? "We'll improve this forecast." : "Is this forecast accurate?"}
        </span>
        {!feedback && (
          <>
            <button
              onClick={() => setFeedback("up")}
              className="dash-btn"
              aria-label="Mark forecast as accurate"
              style={{ padding: "4px 10px", minHeight: 28, gap: 4 }}
            >
              <ThumbsUp size={11} aria-hidden="true" /> Accurate
            </button>
            <button
              onClick={() => setFeedback("down")}
              className="dash-btn"
              aria-label="Mark forecast as inaccurate"
              style={{ padding: "4px 10px", minHeight: 28, gap: 4 }}
            >
              <ThumbsDown size={11} aria-hidden="true" /> Off
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function ForecastsPage() {
  const [data,    setData]    = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forecasts");
      if (res.status === 404) {
        // No forecasts yet — treat as empty, not error
        setData({ forecasts: [], generated_at: null, model: "TimesFM", status: "no_data" });
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const forecasts = data?.forecasts ?? [];
  const generatedAt = data?.generated_at;
  const isLive = forecasts.length > 0;

  return (
    <div className="dash-main">

      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">AI Forecasts</h1>
          <p className="dash-page-sub" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
                borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
                background: isLive ? "rgba(74,222,128,0.1)" : "var(--app-surface-2)",
                border: `1px solid ${isLive ? "rgba(74,222,128,0.25)" : "var(--app-border)"}`,
                color: isLive ? "#4ADE80" : "var(--app-muted)",
              }}
              role="status"
              aria-label={isLive ? "TimesFM intelligence active" : "Waiting for data"}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} aria-hidden="true" />
              {isLive ? "TimesFM Intelligence Active" : "Waiting for data"}
            </span>
            {generatedAt && (
              <span style={{ color: "var(--app-faint)", fontSize: "0.8rem" }}>
                Generated {new Date(generatedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
        <button
          className="dash-btn"
          onClick={load}
          aria-label="Refresh forecasts"
          disabled={loading}
        >
          <RefreshCw size={13} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* Confidence explanation */}
      <div style={{
        display: "flex", gap: "1.5rem", flexWrap: "wrap",
        padding: "0.75rem 1rem", background: "var(--app-surface)", border: "1px solid var(--app-border)",
        borderRadius: "10px", marginBottom: "1.5rem", alignItems: "center",
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--app-faint)", fontWeight: 600 }}>Confidence levels:</span>
        {[
          { dot: "#4ADE80", label: "High: 24+ months of data, consistent signals" },
          { dot: "var(--accent)", label: "Medium: 12+ months, some variance" },
          { dot: "var(--app-muted)", label: "Low: sparse data, early signals only" },
        ].map(({ dot, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--app-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      {/* Chart legend */}
      <div style={{
        display: "flex", gap: "1.25rem", flexWrap: "wrap",
        padding: "0.5rem 1rem", marginBottom: "1.5rem", alignItems: "center",
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--app-faint)" }}>Chart:</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--app-muted)" }}>
          <span style={{ width: 12, height: 8, background: "var(--app-muted)", borderRadius: 2, display: "inline-block" }} aria-hidden="true" />
          Grey bars = historical (actual contract counts)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "var(--app-muted)" }}>
          <span style={{ width: 12, height: 8, background: "var(--accent)", borderRadius: 2, display: "inline-block", opacity: 0.75 }} aria-hidden="true" />
          Gold bars = AI-projected (future forecast)
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}
          aria-label="Loading forecasts"
          aria-busy="true"
        >
          {[1, 2, 3].map(i => <ForecastSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="dash-card">
          <ErrorState
            message={`Failed to load forecasts: ${error}`}
            onRetry={load}
          />
        </div>
      ) : forecasts.length === 0 ? (
        <div className="dash-card">
          <EmptyState
            icon={<BarChart2 size={28} />}
            title="No forecasts yet"
            message="The AI engine generates forecasts nightly based on your NAICS codes. Add NAICS codes to your profile, then check back tomorrow."
            action={
              <a
                href="/dashboard/profile"
                className="dash-btn dash-btn-accent"
                style={{ textDecoration: "none", padding: "8px 16px" }}
              >
                Set up NAICS codes →
              </a>
            }
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {forecasts.map(card => (
            <ForecastCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {!loading && !error && forecasts.length > 0 && (
        <div style={{ marginTop: "2rem", display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <AlertCircle size={13} color="var(--app-faint)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", margin: 0, lineHeight: 1.5 }}>
            Forecasts are generated by Google TimesFM trained on federal contract award history.
            They indicate probability trends, not guaranteed outcomes. Always verify with official SAM.gov data.
          </p>
        </div>
      )}
    </div>
  );
}
