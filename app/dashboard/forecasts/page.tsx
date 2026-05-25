"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BarChart2, AlertCircle, Info, RefreshCw, Clock, TrendingUp, PieChart, Zap } from "lucide-react";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { supabase } from "@/lib/supabase";
import { renderForecastChart, type ForecastCard } from "./ForecastCharts";

/* ─── Types ─────────────────────────────────────────────── */
interface ForecastResponse {
  forecasts: ForecastCard[];
  generated_at: string | null;
  engine: string;
  status: string;
}

/* ─── Tab Configuration — 3 engines ─────────────────────── */
const TABS = [
  { key: "contract_activity",      label: "Contract Activity",  icon: TrendingUp },
  { key: "setaside_opportunities",  label: "Set-Aside Opportunities", icon: PieChart },
  { key: "low_competition_radar",   label: "Low-Competition Radar", icon: Zap },
] as const;

/* ─── Helpers ────────────────────────────────────────────── */
function formatLastUpdated(runDate: string | null): { text: string; isStale: boolean } {
  if (!runDate) return { text: "Not yet updated", isStale: true };
  const days = Math.floor((Date.now() - new Date(runDate).getTime()) / 86400000);
  if (days === 0) return { text: "Updated today", isStale: false };
  if (days === 1) return { text: "Updated yesterday", isStale: false };
  if (days <= 7) return { text: `Updated ${days} days ago`, isStale: false };
  return { text: `Updated ${new Date(runDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — may be outdated`, isStale: true };
}

function ForecastSkeleton() {
  return (
    <div className="dash-card-padded" aria-busy="true">
      <div className="dash-skeleton" style={{ height: 14, width: "30%", marginBottom: 10 }} />
      <div className="dash-skeleton" style={{ height: 22, width: "50%", marginBottom: 16 }} />
      <div className="dash-skeleton" style={{ height: 200, borderRadius: 8, marginBottom: 12 }} />
      <div className="dash-skeleton" style={{ height: 12, width: "80%" }} />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function ForecastsPage() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isColdStart, setIsColdStart] = useState(false);
  const [userNaicsCodes, setUserNaicsCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("contract_activity");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: p, error: profileErr } = await supabase.from("profiles").select("naics_codes").single();
        if (profileErr) throw profileErr;
        setUserNaicsCodes(p?.naics_codes ?? []);
      } catch {
        setError("Failed to load profile data. Please refresh.");
        setLoading(false);
      }
    })();
  }, []);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const load = useCallback(async () => {
    if (!isColdStart) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forecasts");
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === "generating") {
        setIsColdStart(true);
        setData({ forecasts: [], generated_at: null, engine: "quantile", status: "generating" });
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const pollRes = await fetch("/api/forecasts");
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status !== "generating") { setData(pollData); setIsColdStart(false); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
            }
          } catch { /* polling — silent */ }
        }, 30_000);
        setTimeout(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, 1_800_000);
        return;
      }
      setData(json);
      setIsColdStart(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      if (!isColdStart) setLoading(false);
    }
  }, [isColdStart]);

  useEffect(() => { load(); }, [load]);

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
  const allLimited = isLive && forecasts.every(f => f.data_quality?.data_quality === "limited");
  const userNaics = [...new Set(forecasts.map(f => f.naics_code))];

  const withBacktest = forecasts.filter(f => f.backtest_accuracy);
  const avgMape = withBacktest.length > 0
    ? Math.round(withBacktest.reduce((s, f) => s + (f.backtest_accuracy?.mape ?? 0), 0) / withBacktest.length * 10) / 10
    : null;

  return (
    <div className="dash-main dash-fade-in">
      {/* Header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Market Intelligence</h1>
          <p className="dash-page-sub" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
              borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
              background: isLive ? "var(--success-subtle)" : "var(--app-surface-2)",
              border: `1px solid ${isLive ? "rgba(26,119,66,0.2)" : "var(--app-border)"}`,
              color: isLive ? "var(--success)" : "var(--app-muted)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
              {isLive ? "Forecast Engine Active" : "Waiting for data"}
            </span>
            {runDate && (
              <span style={{ fontSize: "0.75rem", color: lastUpdated.isStale ? "var(--warning)" : "var(--app-faint)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} aria-hidden="true" /> {lastUpdated.text}
              </span>
            )}
            {avgMape !== null && (
              <span style={{ fontSize: "0.72rem", color: "var(--app-faint)" }}>
                · Avg accuracy ±{avgMape}%
              </span>
            )}
          </p>
        </div>
        <button className="dash-btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* Limited data banner */}
      {allLimited && (
        <div style={{ padding: "0.875rem 1rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", background: "var(--app-surface)", border: "1px solid var(--app-border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 4 }}>Limited historical data</div>
            <p style={{ fontSize: "0.75rem", color: "var(--app-muted)", margin: 0, lineHeight: 1.5 }}>
              Your NAICS codes ({userNaics.join(", ")}) have fewer than 18 months of federal award history. Forecasts will improve as data accumulates.
            </p>
          </div>
        </div>
      )}

      {/* Data quality legend */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", padding: "0.75rem 1rem", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: "var(--radius-md)", marginBottom: "1rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--app-faint)", fontWeight: 600 }}>Data quality:</span>
        {[
          { dot: "var(--success)", label: "Rich — 36+ months of history" },
          { dot: "var(--accent)", label: "Adequate — 18–35 months" },
          { dot: "var(--app-muted)", label: "Limited — <18 months" },
        ].map(({ dot, label }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--app-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} /> {label}
          </span>
        ))}
        {avgMape !== null && (
          <span style={{ fontSize: "0.72rem", color: "var(--app-faint)", marginLeft: "auto" }}>
            Backtested accuracy: ±{avgMape}% MAPE (past 90 days)
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      {!loading && !error && isLive && (
        <div className="dash-status-tabs" style={{ marginBottom: "var(--space-5)", overflowX: "auto" }}>
          {TABS.map(tab => {
            const count = byType.get(tab.key)?.length ?? 0;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className="dash-status-tab"
                data-active={activeTab === tab.key ? "true" : undefined}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={12} aria-hidden="true" style={{ marginRight: 4 }} />
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
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 8 }}>
            Building your market forecasts...
          </h2>
          <p style={{ color: "var(--app-muted)", marginBottom: "2rem" }}>
            This takes 3–8 minutes. Analyzing {userNaicsCodes.length} NAICS codes against federal award history.
          </p>
          <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "left", background: "var(--app-surface-2)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--app-border)" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--app-text)", fontWeight: 600, marginBottom: "0.75rem" }}>
              Forecasts being generated:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem", color: "var(--app-muted)" }}>
              {TABS.map(t => <li key={t.key}><span style={{ color: "var(--accent)", marginRight: 8 }}>◌</span>{t.label}</li>)}
            </ul>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--app-faint)", marginTop: "2rem" }}>This page will update automatically when ready.</p>
        </div>
      ) : loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {[1, 2].map(i => <ForecastSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="dash-card"><ErrorState message={`Failed to load forecasts: ${error}`} onRetry={load} /></div>
      ) : !isLive ? (
        <div className="dash-card">
          <EmptyState
            icon={<BarChart2 size={28} />}
            title="No forecasts yet"
            message="Market forecasts are generated from your NAICS codes against 10+ years of federal award data. Add NAICS codes to your profile, then check back after the next weekly analysis."
            action={<a href="/dashboard/profile" className="dash-btn dash-btn-accent" style={{ textDecoration: "none", padding: "8px 16px" }}>Set up NAICS codes →</a>}
          />
        </div>
      ) : (
        <>
          {tabCards.length === 0 ? (
            <div className="dash-card-padded" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
              <BarChart2 size={28} style={{ color: "var(--app-faint)", margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--app-text)", marginBottom: 6 }}>
                No data for this forecast type
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--app-muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
                Not enough historical federal award data in your NAICS codes to generate this forecast. This requires at least 18 months of records per NAICS/agency combination.
              </p>
            </div>
          ) : (
            renderForecastChart(activeTab, tabCards)
          )}
        </>
      )}

      {/* Disclaimer */}
      {!loading && !error && isLive && (
        <div style={{ marginTop: "2rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={13} style={{ color: "var(--app-faint)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <p style={{ fontSize: "0.75rem", color: "var(--app-faint)", margin: 0, lineHeight: 1.5 }}>
            Generated from historical federal award data. Forecasts indicate probability trends, not guaranteed outcomes. Always verify with official SAM.gov data.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 0.8s linear infinite; }`}</style>
    </div>
  );
}
