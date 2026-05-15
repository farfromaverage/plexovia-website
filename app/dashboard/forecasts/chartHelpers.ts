/* Chart helpers — shared types, insight computation, color mapping */

export interface ChartPoint { period: string; historical?: number; projected?: number; }
export interface ForecastCard {
  id: string; naics_code: string; naics_label: string; agency_name: string;
  forecast_type: string; prediction_type: "increase" | "decrease" | "stable";
  confidence: "high" | "medium" | "low"; percent_change: number;
  insight_text: string; data_points: ChartPoint[];
  generated_at: string | null; run_date: string | null;
}

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
  if (c === "high") return "High";
  if (c === "medium") return "Medium";
  return "Low";
}

/** Compute a plain-English insight headline from forecast cards */
export function computeInsight(cards: ForecastCard[], type: string): { headline: string; subtext: string } {
  if (!cards.length) return { headline: "No data available", subtext: "Add more NAICS codes to improve predictions." };

  const count = cards.length;
  const highConf = cards.filter(c => c.confidence === "high").length;
  const increasing = cards.filter(c => c.prediction_type === "increase").length;

  // Find the most common upcoming month
  const months = cards.flatMap(c => c.data_points.filter(d => d.projected !== undefined).map(d => d.period));
  const monthCounts = new Map<string, number>();
  months.forEach(m => monthCounts.set(m, (monthCounts.get(m) || 0) + 1));
  const peakMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "upcoming months";

  const naicsList = [...new Set(cards.map(c => c.naics_code))];
  const naicsStr = naicsList.length <= 2 ? naicsList.join(" & ") : `${naicsList.length} NAICS codes`;

  switch (type) {
    case "renewal_radar":
      return {
        headline: `${count} contract${count !== 1 ? "s" : ""} in your sector ${count !== 1 ? "are" : "is"} likely to renew soon.`,
        subtext: `${highConf > 0 ? `${highConf} high-confidence` : "Based on historical"} renewal patterns across ${naicsStr}. Peak activity expected around ${peakMonth}.`,
      };
    case "budget_heatmap":
      return {
        headline: `${increasing} of ${count} agencies show spending increases in ${naicsStr}.`,
        subtext: `Budget flush patterns suggest agencies may accelerate procurement around ${peakMonth}. Higher intensity = larger change from baseline.`,
      };
    case "sub_trickle":
      return {
        headline: `${count} prime contractor${count !== 1 ? "s" : ""} may release sub-contract RFQs.`,
        subtext: `Colored bars show the predicted window when subcontracting opportunities are most likely. Wider bars = longer opportunity window.`,
      };
    case "incumbent_vulnerability":
      const highRisk = cards.filter(c => Math.abs(c.percent_change) > 70).length;
      return {
        headline: `${highRisk > 0 ? `${highRisk} incumbent${highRisk !== 1 ? "s" : ""} score${highRisk === 1 ? "s" : ""} above 70% vulnerability` : `${count} incumbents analyzed`} — potential openings.`,
        subtext: `Higher scores mean the current contract holder is more likely to lose the re-compete. Red = high opportunity, green = low.`,
      };
    case "setaside_depletion":
      return {
        headline: `Set-aside spending predicted to ${increasing > count / 2 ? "surge" : "shift"} across ${count} agencies.`,
        subtext: `Gray bars = current activity. Purple bars = predicted burst. Agencies must spend set-aside budgets before fiscal year end.`,
      };
    case "zero_competition":
      const top = [...cards].sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change))[0];
      return {
        headline: `${count} upcoming contract${count !== 1 ? "s" : ""} ${count !== 1 ? "have" : "has"} zero predicted bidders.`,
        subtext: top ? `Highest opportunity: ${top.agency_name || "Federal Government"} (${Math.min(100, Math.abs(top.percent_change))}% probability). These are your lowest-competition wins.` : "",
      };
    case "micro_purchase_surge":
      return {
        headline: `Micro-purchase activity peaks around ${peakMonth} for ${count} agencies.`,
        subtext: `Darker cells = more predicted purchases. Micro-purchases (<$10K) don't require full bids — faster wins.`,
      };
    default:
      return { headline: `${count} predictions available.`, subtext: "Review the data below." };
  }
}
