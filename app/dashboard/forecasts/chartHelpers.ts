/* Chart helpers — shared types, insight computation, color mapping for 3 forecasts */

export interface ChartPoint {
  period: string;
  historical?: number;
  projected?: number;
  p10?: number;
  p50?: number;
  p90?: number;
}

export interface ForecastCard {
  id: string;
  naics_code: string;
  naics_label: string;
  agency_name: string;
  forecast_type: string;
  forecast_type_label: string;
  prediction_type: "increase" | "decrease" | "stable";
  confidence: "high" | "medium" | "low";
  percent_change: number;
  insight_text: string;
  data_points: ChartPoint[];
  quantile_bands?: { p10: number[]; p50: number[]; p90: number[] };
  data_quality: { data_points: number; data_quality: "rich" | "adequate" | "limited" };
  backtest_accuracy: { mape: number; validations: number } | null;
  explainability: Explainability | null;
  run_date: string | null;
}

export interface Explainability {
  headline: string;
  pattern: string;
  peak_month: string;
  baseline_value: number;
  peak_multiplier: number;
  trend_pct: number;
  volatility_pct: number;
  data_points: number;
  explanation: string;
  direction?: string;
  current_monthly_avg?: number;
  predicted_burst?: number;
  burst_month?: string;
  competition_level?: string;
  mean_single_bidder?: number;
  total_historical_awards?: number;
}

/* ─── Confidence colors ──────────────────────────────────── */
export function confColor(c: string) {
  if (c === "high") return "var(--success)";
  if (c === "medium") return "var(--accent)";
  return "var(--app-muted)";
}

export function confBg(c: string) {
  if (c === "high") return "var(--success-subtle)";
  if (c === "medium") return "var(--accent-subtle)";
  return "var(--app-surface-2)";
}

export function confLabel(c: string) {
  if (c === "high") return "High — 36+ months";
  if (c === "medium") return "Medium — 18–35 months";
  return "Limited — <18 months";
}

export function qualityLabel(q: "rich" | "adequate" | "limited") {
  if (q === "rich") return "Rich data (36+ months)";
  if (q === "adequate") return "Adequate data (18–35 months)";
  return "Limited data (<18 months)";
}

/* ─── Insight headlines per forecast type ────────────────── */
export function computeInsight(
  cards: ForecastCard[],
  type: string,
): { headline: string; subtext: string } {
  if (!cards.length) {
    return { headline: "No data available", subtext: "Add more NAICS codes to your profile to generate forecasts." };
  }

  const count = cards.length;
  const highConf = cards.filter(c => c.confidence === "high").length;
  const naicsList = [...new Set(cards.map(c => c.naics_code))];
  const naicsStr = naicsList.length <= 2 ? naicsList.join(" & ") : `${naicsList.length} NAICS codes`;

  const months = cards.flatMap(c =>
    c.data_points.filter(d => d.projected !== undefined).map(d => d.period)
  );
  const monthCounts = new Map<string, number>();
  months.forEach(m => monthCounts.set(m, (monthCounts.get(m) || 0) + 1));
  const peakMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "upcoming months";

  switch (type) {
    case "contract_activity": {
      const peaks = cards.filter(c => (c.explainability?.peak_multiplier ?? 0) >= 1.5).length;
      return {
        headline: `${peaks > 0 ? `${peaks} activity peak${peaks !== 1 ? "s" : ""} detected` : `${count} forecasts available`} across ${naicsStr}.`,
        subtext: `${highConf > 0 ? `${highConf} with rich historical data.` : ""} Shaded bands show the P10–P90 uncertainty range around each prediction.`,
      };
    }
    case "setaside_opportunities": {
      const behind = cards.filter(c => c.explainability?.direction === "falling_behind").length;
      return {
        headline: behind > 0
          ? `${behind} agenc${behind !== 1 ? "ies" : "y"} behind on set-aside goals — bursts predicted.`
          : `Set-aside projections across ${count} agencies.`,
        subtext: "Gray bars = current monthly average. Navy bars = predicted burst contracts. Agencies must meet statutory small business goals.",
      };
    }
    case "low_competition_radar": {
      const lowComp = cards.filter(c =>
        c.explainability?.competition_level === "very_low" || c.explainability?.competition_level === "low"
      ).length;
      return {
        headline: lowComp > 0
          ? `${lowComp} categor${lowComp !== 1 ? "ies" : "y"} with very low competition — potential openings.`
          : `${count} categories analyzed — competition levels vary.`,
        subtext: "Bubble size = total award volume. Further right = less competition. Red bubbles = your best opportunities.",
      };
    }
    default:
      return { headline: `${count} predictions available.`, subtext: "Review the data below." };
  }
}
