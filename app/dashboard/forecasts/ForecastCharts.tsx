"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, PieChart, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, ReferenceLine } from "recharts";
import { type ForecastCard, confColor, confBg, computeInsight } from "./chartHelpers";
export type { ForecastCard } from "./chartHelpers";

/* ─── Shared sub-components ──────────────────────────────── */
function InsightHeader({ icon, iconClass, headline, subtext }: {
  icon: React.ReactNode; iconClass: string; headline: string; subtext: string;
}) {
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

function QualityBadge({ quality }: { quality: "rich" | "adequate" | "limited" }) {
  const config = {
    rich: { bg: "var(--success-subtle)", color: "var(--success)", label: "Rich data" },
    adequate: { bg: "var(--accent-subtle)", color: "var(--accent)", label: "Adequate data" },
    limited: { bg: "var(--app-surface-2)", color: "var(--app-muted)", label: "Limited data" },
  };
  const c = config[quality];
  return (
    <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 999, background: c.bg, color: c.color, fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

/* ─── P1: Contract Activity Forecast — Timeline Ribbon ───── */
export function ContractActivityChart({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "contract_activity");
  const withPeak = cards.map(card => {
    const projPoints = card.data_points.filter(d => d.projected !== undefined);
    const peak = projPoints.reduce((best, d) => (!best || (d.projected || 0) > (best.projected || 0)) ? d : best, projPoints[0]);
    return { card, peak, firstProj: projPoints[0] };
  }).filter(x => x.firstProj);
  withPeak.sort((a, b) => (a.firstProj?.period || "").localeCompare(b.firstProj?.period || ""));
  const topNaics = cards[0]?.naics_code || "";

  if (!withPeak.length) return null;

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<TrendingUp size={18} />} iconClass="accent" headline={insight.headline} subtext={insight.subtext} />
      <div>
        {withPeak.map(({ card, peak }) => {
          const explain = card.explainability;
          return (
            <div key={card.id} style={{ padding: "1rem var(--space-5)", borderBottom: "1px solid var(--app-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 2 }}>
                    {card.agency_name || "Federal Government"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--app-faint)" }}>
                    NAICS {card.naics_code} · {card.naics_label}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {explain?.peak_month && (
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--app-text)", background: "var(--accent-subtle)", padding: "4px 10px", borderRadius: 999 }}>
                      Peak: {explain.peak_month}
                    </span>
                  )}
                  <QualityBadge quality={card.data_quality.data_quality} />
                </div>
              </div>

              <div style={{ height: 60, marginBottom: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={card.data_points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <Bar dataKey="historical" fill="var(--app-muted)" radius={[1, 1, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="projected" fill="var(--accent)" radius={[1, 1, 0, 0]} opacity={0.85} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {explain?.explanation && (
                <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "4px 0 0", lineHeight: 1.45 }}>
                  {explain.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <ActionFooter naics={topNaics} label="View matching contracts" />
    </div>
  );
}

/* ─── P5: Set-Aside Opportunities — Waterfall Gap Chart ───── */
export function SetAsideOpportunitiesChart({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "setaside_opportunities");

  const data = cards.slice(0, 15).map(card => {
    const explain = card.explainability;
    const currentAvg = explain?.current_monthly_avg ?? 0;
    const predicted = explain?.predicted_burst ?? 0;
    const shortfall = Math.max(0, predicted - currentAvg);

    return {
      name: (card.agency_name || "Federal Gov").length > 18
        ? (card.agency_name || "Federal Gov").slice(0, 16) + "..."
        : (card.agency_name || "Federal Gov"),
      current: Math.round(currentAvg),
      shortfall: Math.round(shortfall),
      predictedBurst: Math.round(predicted),
      naics: card.naics_code,
      label: card.naics_label,
      direction: explain?.direction,
    };
  });

  const topNaics = cards[0]?.naics_code || "";

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<PieChart size={18} />} iconClass="accent" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body">
        <div style={{ height: Math.max(260, data.length * 38) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" width={165} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="current" stackId="a" fill="var(--app-muted)" name="Current avg/month" radius={[0, 0, 0, 0]} />
              <Bar dataKey="shortfall" stackId="a" fill="#e6a817" name="Shortfall" radius={[0, 0, 0, 0]} />
              <Bar dataKey="predictedBurst" fill="var(--accent)" name="Predicted burst" radius={[0, 3, 3, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: "var(--space-5)", fontSize: "0.72rem", color: "var(--app-muted)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
          {[
            { c: "var(--app-muted)", l: "Current avg" },
            { c: "#e6a817", l: "Shortfall" },
            { c: "var(--accent)", l: "Predicted burst" },
          ].map(x => (
            <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: x.c }} /> {x.l}
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem", marginTop: "var(--space-4)" }}>
          {cards.slice(0, 6).map(card => {
            const explain = card.explainability;
            return (
              <div key={card.id} className="dash-card" style={{ padding: "0.875rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--app-text)", marginBottom: 4 }}>
                  {card.agency_name || "Federal Government"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--app-faint)", marginBottom: 6 }}>
                  NAICS {card.naics_code} · {card.naics_label}
                </div>
                {explain?.explanation && (
                  <p style={{ fontSize: "0.7rem", color: "var(--app-muted)", lineHeight: 1.4, margin: 0 }}>
                    {explain.explanation}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.62rem", padding: "2px 6px", borderRadius: 999, background: confBg(card.confidence), color: confColor(card.confidence) }}>
                    {card.data_quality.data_quality}
                  </span>
                  {card.backtest_accuracy && (
                    <span style={{ fontSize: "0.65rem", color: "var(--app-faint)" }}>
                      ±{card.backtest_accuracy.mape}% MAPE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ActionFooter naics={topNaics} label="View set-aside contracts" />
    </div>
  );
}

/* ─── P6: Low-Competition Radar — Scatter/Bubble Chart ────── */
export function LowCompetitionRadarChart({ cards }: { cards: ForecastCard[] }) {
  const insight = computeInsight(cards, "low_competition_radar");

  const scatterData = cards.slice(0, 50).map(card => {
    const explain = card.explainability;
    const competitionPct = explain?.mean_single_bidder
      ? Math.min(100, Math.round(explain.mean_single_bidder * 10))
      : Math.min(100, Math.abs(card.percent_change));
    const volume = Math.max(1, Math.abs(card.percent_change) * 10 || 10);
    const level = explain?.competition_level || "moderate";

    return {
      name: (card.agency_name || "Federal Gov").slice(0, 22),
      competition: competitionPct,
      volume: volume,
      level: level,
      naics: card.naics_code,
      label: card.naics_label,
      avgSingleBidder: explain?.mean_single_bidder ?? 0,
      totalAwards: explain?.total_historical_awards ?? 0,
      explanation: explain?.explanation || card.insight_text,
    };
  });

  const levelColor = (level: string) => {
    switch (level) {
      case "very_low": return "var(--danger)";
      case "low": return "#e6a817";
      case "moderate": return "var(--accent)";
      default: return "var(--success)";
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const d = payload[0].payload;
      return (
        <div style={{ ...TOOLTIP_STYLE, padding: "10px 14px", maxWidth: 320 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: "var(--app-text)", marginBottom: 4 }}>{d.name}</div>
          <div style={{ fontSize: 10, color: "var(--app-faint)", marginBottom: 6 }}>NAICS {d.naics} · {d.label}</div>
          <div style={{ fontSize: 10, color: "var(--app-muted)", lineHeight: 1.5 }}>
            Competition: {d.competition}% ({d.level.replace("_", " ")})<br />
            Avg single-bidder: {d.avgSingleBidder}/mo<br />
            Total awards: {d.totalAwards}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dash-chart-panel">
      <InsightHeader icon={<Zap size={18} />} iconClass="warning" headline={insight.headline} subtext={insight.subtext} />
      <div className="dash-chart-body">
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number" dataKey="competition" name="Competition %"
                domain={[0, 100]} tickLine={false} axisLine={false}
                tick={{ fontSize: 9 }}
                label={{ value: "Single-bidder % (lower = more competitive)", position: "bottom", offset: -2, style: { fontSize: 10, fill: "var(--app-faint)" } }}
              />
              <YAxis
                type="number" dataKey="volume" name="Volume"
                tickLine={false} axisLine={false} tick={{ fontSize: 9 }}
                label={{ value: "Volume index", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "var(--app-faint)" } }}
              />
              <ZAxis type="number" dataKey="volume" range={[40, 400]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={50} stroke="var(--app-border)" strokeDasharray="5 5" label={{ value: "Threshold", position: "top", fontSize: 9, fill: "var(--app-faint)" }} />
              <Scatter data={scatterData} animationDuration={800}>
                {scatterData.map((d, idx) => (
                  <Cell key={idx} fill={levelColor(d.level)} opacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: "var(--space-5)", fontSize: "0.72rem", color: "var(--app-muted)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
          {[
            { c: "var(--danger)", l: "Very low competition" },
            { c: "#e6a817", l: "Low competition" },
            { c: "var(--accent)", l: "Moderate" },
            { c: "var(--success)", l: "Competitive" },
          ].map(x => (
            <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: x.c, opacity: 0.75 }} /> {x.l}
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.75rem", marginTop: "var(--space-4)" }}>
          {cards.slice(0, 6).map(card => {
            const explain = card.explainability;
            const probColor = explain?.competition_level === "very_low" ? "var(--danger)" :
                             explain?.competition_level === "low" ? "#e6a817" :
                             "var(--accent)";
            return (
              <div key={card.id} className="dash-card" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--app-text)" }}>
                    {card.agency_name || "Federal Government"}
                  </div>
                  <div className="dash-mono" style={{ fontSize: "1.1rem", fontWeight: 800, color: probColor }}>
                    {explain?.mean_single_bidder?.toFixed(0) ?? "—"}/mo
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                  <span className="dash-tag dash-tag-muted dash-mono" style={{ fontSize: "0.62rem" }}>NAICS {card.naics_code}</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--app-faint)" }}>{card.naics_label}</span>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--app-muted)", margin: "0 0 var(--space-3)", lineHeight: 1.4 }}>
                  {explain?.explanation || card.insight_text}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: "0.62rem", padding: "2px 6px", borderRadius: 999, background: confBg(card.confidence), color: confColor(card.confidence) }}>
                      {card.data_quality.data_quality}
                    </span>
                    {card.backtest_accuracy && (
                      <span style={{ fontSize: "0.65rem", color: "var(--app-faint)" }}>
                        ±{card.backtest_accuracy.mape}% MAPE
                      </span>
                    )}
                  </div>
                  <Link href={`/dashboard/contracts?search=${encodeURIComponent(card.naics_code)}`} className="dash-link-subtle" style={{ fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    Contracts <ArrowUpRight size={10} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Chart Dispatcher — v2.4.0 (3-type system) ──────────── */
export function renderForecastChart(type: string, cards: ForecastCard[]) {
  switch (type) {
    case "contract_activity": return <ContractActivityChart cards={cards} />;
    case "setaside_opportunities": return <SetAsideOpportunitiesChart cards={cards} />;
    case "low_competition_radar": return <LowCompetitionRadarChart cards={cards} />;
    default: return <ContractActivityChart cards={cards} />;
  }
}
