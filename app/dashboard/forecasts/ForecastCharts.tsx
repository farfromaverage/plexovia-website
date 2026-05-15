"use client";

import Link from "next/link";
import { ArrowUpRight, RefreshCw, TrendingUp, BarChart3, Layers, Shield, PieChart, Zap, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { type ForecastCard, confColor, confBg, confLabel, computeInsight } from "./chartHelpers";
export type { ForecastCard } from "./chartHelpers";

/* ─── Shared sub-components ───────────────────────────────── */
function InsightHeader({ icon, iconClass, headline, subtext }: { icon: React.ReactNode; iconClass: string; headline: string; subtext: string }) {
  return (
    <div className="dash-chart-insight" style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
      <div className={`dash-chart-insight-icon ${iconClass}`}>{icon}</div>
      <div style={{ flex: 1 }}>
        <h3 className="dash-chart-headline">{headline}</h3>
        <p className="dash-chart-subtext">{subtext}</p>
      </div>
    </div>
  );
}

function ActionFooter({ naics, label }: { naics: string; label: string }) {
  return (
    <div className="dash-chart-footer">
      <Link href={`/dashboard/contracts?search=${encodeURIComponent(naics)}`} className="dash-link-subtle" style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label} <ArrowUpRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}

const TOOLTIP_STYLE = { background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, fontSize: 11, boxShadow: "var(--shadow-md)" };

/* ─── P1: Renewal Radar — Timeline List ───────────────────── */
export function RenewalRadarChart({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "renewal_radar");
  const withPeak = cards.map(card => {
    const projPoints = card.data_points.filter(d => d.projected !== undefined);
    const peak = projPoints.reduce((best, d) => (!best || (d.projected || 0) > (best.projected || 0)) ? d : best, projPoints[0]);
    return { card, peak, firstProj: projPoints[0] };
  }).filter(x => x.firstProj);
  withPeak.sort((a, b) => (a.firstProj?.period || "").localeCompare(b.firstProj?.period || ""));
  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<RefreshCw size={18} />} iconClass="accent" headline={insight.headline} subtext={insight.subtext} />
      <div>
        {withPeak.map(({ card, peak }) => (
          <div key={card.id} style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.875rem var(--space-5)", borderBottom: "1px solid var(--app-border)" }}>
            <div style={{ width: 4, height: 48, borderRadius: 2, background: confColor(card.confidence), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 2 }}>{card.agency_name || "Federal Government"}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--app-faint)", marginBottom: 3 }}>NAICS {card.naics_code} · {card.naics_label}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--app-muted)", lineHeight: 1.4 }}>{card.insight_text || "No renewal pattern detected"}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {peak && <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 4 }}>{peak.period}</div>}
              <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: confBg(card.confidence), color: confColor(card.confidence) }}>{confLabel(card.confidence)}</span>
            </div>
          </div>
        ))}
      </div>
      <ActionFooter naics={topNaics} label="View matching contracts" />
    </div>
  );
}

/* ─── P2: Spending Heatmap — Table ────────────────────────── */
export function SpendingHeatmapChart({ cards }: { cards: ForecastCard[] }) {
  if (!cards.length) return null;
  const insight = computeInsight(cards, "budget_heatmap");
  const projMonths = [...new Set(cards.flatMap(c => c.data_points.filter(d => d.projected !== undefined).map(d => d.period)))].slice(0, 6);
  const rows = cards.slice(0, 20).map(card => {
    const histPoints = card.data_points.filter(d => d.historical !== undefined);
    const baseline = histPoints.length > 0 ? (histPoints[histPoints.length - 1].historical || 1) : 1;
    const projData = projMonths.map(m => {
      const dp = card.data_points.find(d => d.period === m);
      const val = dp?.projected || 0;
      const pctInc = baseline > 0 ? Math.round(((val - baseline) / baseline) * 100) : 0;
      return { period: m, pctInc };
    });
    return { card, projData };
  });
  const maxPct = Math.max(...rows.flatMap(r => r.projData.map(d => Math.abs(d.pctInc))), 1);
  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<TrendingUp size={18} />} iconClass="warning" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body" style={{ overflowX: "auto" }}>
        <table className="dash-heatmap">
          <thead><tr><th>Agency</th>{projMonths.map(m => <th key={m}>{m}</th>)}</tr></thead>
          <tbody>
            {rows.map(({ card, projData }) => (
              <tr key={card.id}>
                <td title={`${card.agency_name} · NAICS ${card.naics_code}`}>{card.agency_name || "Federal Government"}</td>
                {projData.map(d => {
                  const intensity = Math.min(1, Math.abs(d.pctInc) / maxPct);
                  const isNeg = d.pctInc < 0;
                  return (
                    <td key={d.period}>
                      <div className="dash-heat-cell" title={`${d.pctInc > 0 ? "+" : ""}${d.pctInc}% from baseline`} style={{
                        background: intensity > 0.05 ? (isNeg ? `rgba(194,59,59,${0.1 + intensity * 0.5})` : `rgba(99,91,255,${0.1 + intensity * 0.6})`) : "var(--app-surface-2)",
                        fontWeight: intensity > 0.3 ? 600 : 400,
                        color: intensity > 0.4 ? "var(--app-text)" : "var(--app-faint)",
                      }}>{d.pctInc !== 0 ? `${d.pctInc > 0 ? "+" : ""}${d.pctInc}%` : ""}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActionFooter naics={topNaics} label="View contracts by NAICS" />
    </div>
  );
}

/* ─── P3: Sub-Trickle Gantt ───────────────────────────────── */
export function SubTrickleGantt({ cards }: { cards: ForecastCard[] }) {
  if (!cards.length) return null;
  const insight = computeInsight(cards, "sub_trickle");
  const projMonths = [...new Set(cards.flatMap(c => c.data_points.filter(d => d.projected !== undefined).map(d => d.period)))].slice(0, 12);
  if (!projMonths.length) return null;

  const rows = cards.slice(0, 15).map(card => {
    const projPoints = card.data_points.filter(d => d.projected !== undefined);
    if (!projPoints.length) return null;
    const avg = projPoints.reduce((s, d) => s + (d.projected || 0), 0) / projPoints.length;
    const threshold = avg * 0.8;
    let startIdx = -1, endIdx = -1;
    projPoints.forEach((d, i) => { if ((d.projected || 0) > threshold) { if (startIdx === -1) startIdx = i; endIdx = i; } });
    if (startIdx === -1) { startIdx = 0; endIdx = 0; }
    return { agency: card.agency_name || "Federal Government", naics: card.naics_code, startMonth: projPoints[startIdx]?.period || "", endMonth: projPoints[endIdx]?.period || "", startPct: (startIdx / Math.max(1, projMonths.length - 1)) * 100, widthPct: Math.max(8, ((endIdx - startIdx + 1) / Math.max(1, projMonths.length)) * 100), confidence: card.confidence };
  }).filter(Boolean) as { agency: string; naics: string; startMonth: string; endMonth: string; startPct: number; widthPct: number; confidence: string }[];
  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<Layers size={18} />} iconClass="info" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body">
        {/* Month header */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--app-border)", paddingBottom: 4, marginBottom: 8 }}>
          <div className="dash-gantt-label" style={{ fontWeight: 600, fontSize: "0.68rem", color: "var(--app-muted)" }}>Prime Contractor</div>
          <div style={{ flex: 1, display: "flex" }}>
            {projMonths.map(m => <div key={m} style={{ flex: 1, textAlign: "center", fontSize: "0.62rem", color: "var(--app-faint)" }}>{m}</div>)}
          </div>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="dash-gantt-row">
            <div className="dash-gantt-label" title={`${row.agency} · NAICS ${row.naics}`}>{row.agency}</div>
            <div className="dash-gantt-track">
              <div className="dash-gantt-bar" title={`Sub-RFQ window: ${row.startMonth} → ${row.endMonth}`}
                style={{ left: `${row.startPct}%`, width: `${row.widthPct}%`, background: confColor(row.confidence), opacity: 0.75 }}>
                {row.startMonth} → {row.endMonth}
              </div>
            </div>
          </div>
        ))}
      </div>
      <ActionFooter naics={topNaics} label="View sub-contracting opportunities" />
    </div>
  );
}

/* ─── P4: Incumbent Vulnerability — Recharts Horizontal Bar ── */
export function IncumbentVulnerabilityChart({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "incumbent_vulnerability");
  const data = cards.slice(0, 15).map(c => ({
    name: `${(c.agency_name || "Federal Gov").slice(0, 20)} · ${c.naics_code}`,
    value: Math.min(100, Math.abs(c.percent_change)),
    agency: c.agency_name, naics: c.naics_code,
  })).sort((a, b) => b.value - a.value);
  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<Shield size={18} />} iconClass="danger" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body">
        <div style={{ height: Math.max(200, data.length * 38) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
              <YAxis type="category" dataKey="name" width={180} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}%`, "Vulnerability"]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={800}>
                {data.map((d, idx) => (
                  <Cell key={idx} fill={d.value > 70 ? "var(--danger)" : d.value > 40 ? "var(--warning)" : "var(--success)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "var(--space-5)", fontSize: "0.72rem", color: "var(--app-muted)", marginTop: "var(--space-3)" }}>
          {[{ c: "var(--danger)", l: ">70% High opportunity" }, { c: "var(--warning)", l: "40–70% Medium" }, { c: "var(--success)", l: "<40% Low" }].map(x => (
            <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} /> {x.l}
            </span>
          ))}
        </div>
      </div>
      <ActionFooter naics={topNaics} label="View vulnerable contracts" />
    </div>
  );
}

/* ─── P5: Set-Aside Depletion — Recharts Grouped Bar ──────── */
export function SetAsideDepletionChart({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "setaside_depletion");
  const data = cards.slice(0, 12).map(card => {
    const hist = card.data_points.filter(d => d.historical !== undefined);
    const proj = card.data_points.filter(d => d.projected !== undefined);
    return {
      name: (card.agency_name || "Federal Gov").length > 18 ? (card.agency_name || "Federal Gov").slice(0, 16) + "…" : (card.agency_name || "Federal Gov"),
      current: hist.length > 0 ? Math.round(hist[hist.length - 1].historical || 0) : 0,
      predicted: proj.length > 0 ? Math.round(Math.max(0, ...proj.map(d => d.projected || 0))) : 0,
      naics: card.naics_code,
    };
  });
  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<PieChart size={18} />} iconClass="accent" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={50} tick={{ fontSize: 9 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="current" fill="var(--app-muted)" name="Current" radius={[3, 3, 0, 0]} animationDuration={800} />
              <Bar dataKey="predicted" fill="var(--accent)" name="Predicted Burst" radius={[3, 3, 0, 0]} opacity={0.85} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ActionFooter naics={topNaics} label="View set-aside contracts" />
    </div>
  );
}

/* ─── P6: Zero-Competition — Card Grid ────────────────────── */
export function ZeroCompetitionCards({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "zero_competition");
  const sorted = [...cards].sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change));

  return (
    <div>
      <div className="dash-chart-panel" style={{ marginBottom: "var(--space-4)" }}>
        <InsightHeader icon={<Zap size={18} />} iconClass="success" headline={insight.headline} subtext={insight.subtext} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem" }}>
        {sorted.map(card => {
          const firstProj = card.data_points.find(d => d.projected !== undefined);
          const prob = Math.min(100, Math.abs(card.percent_change));
          const probColor = prob > 70 ? "var(--success)" : prob > 40 ? "var(--accent)" : "var(--app-muted)";
          return (
            <div key={card.id} className="dash-card" style={{ padding: "1rem", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--app-text)" }}>{card.agency_name || "Federal Government"}</div>
                <div className="dash-mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: probColor }}>{prob}%</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <span className="dash-tag dash-tag-muted dash-mono" style={{ fontSize: "0.62rem" }}>NAICS {card.naics_code}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--app-faint)" }}>{card.naics_label}</span>
              </div>
              {firstProj && <div style={{ fontSize: "0.72rem", color: "var(--app-muted)", marginBottom: 6 }}>Forecast: <strong style={{ color: "var(--app-text)" }}>{firstProj.period}</strong></div>}
              <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "0 0 var(--space-3)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{card.insight_text}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", padding: "2px 6px", borderRadius: 999, background: confBg(card.confidence), color: confColor(card.confidence) }}>{confLabel(card.confidence)}</span>
                <Link href={`/dashboard/contracts?search=${encodeURIComponent(card.naics_code)}`} className="dash-link-subtle" style={{ fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 3 }}>
                  View contracts <ArrowUpRight size={10} aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── P7: Micro-Purchase Surge — Heatmap Table ────────────── */
export function MicroPurchaseSurgeChart({ cards }: { cards: ForecastCard[] }) {
  if (!cards.length) return null;
  const insight = computeInsight(cards, "micro_purchase_surge");
  const projMonths = [...new Set(cards.flatMap(c => c.data_points.filter(d => d.projected !== undefined).map(d => d.period)))].slice(0, 12);
  const maxVal = Math.max(...cards.flatMap(c => c.data_points.filter(d => d.projected !== undefined).map(d => d.projected || 0)), 1);
  const rows = cards.slice(0, 20);
  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<ShoppingCart size={18} />} iconClass="accent" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body" style={{ overflowX: "auto" }}>
        <table className="dash-heatmap">
          <thead><tr><th>Agency</th>{projMonths.map(m => <th key={m} style={{ fontSize: "0.62rem" }}>{m}</th>)}</tr></thead>
          <tbody>
            {rows.map(card => (
              <tr key={card.id}>
                <td title={`${card.agency_name} · NAICS ${card.naics_code}`}>{card.agency_name || "Federal Government"}</td>
                {projMonths.map(m => {
                  const dp = card.data_points.find(d => d.period === m);
                  const val = dp?.projected || 0;
                  const intensity = Math.min(1, val / maxVal);
                  return (
                    <td key={m}>
                      <div className="dash-heat-cell" title={`${Math.round(val)} purchases`} style={{
                        background: intensity > 0.05 ? `rgba(99,91,255,${0.1 + intensity * 0.65})` : "var(--app-surface-2)",
                        fontWeight: intensity > 0.3 ? 600 : 400,
                        color: intensity > 0.4 ? "var(--app-bg)" : "var(--app-faint)",
                      }}>{val > 0 ? Math.round(val) : ""}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActionFooter naics={topNaics} label="View micro-purchase contracts" />
    </div>
  );
}
