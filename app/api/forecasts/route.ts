/**
 * Plexovia — GET /api/forecasts
 * Serves 3 forecast types (down from 7 in v2.4.0):
 *   renewal_radar        → Contract Activity Forecast
 *   setaside_depletion   → Set-Aside Opportunities
 *   zero_competition     → Low-Competition Radar
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* ─── NAICS Code → Human Label Mapping ────────────────────────────────── */
const NAICS_LABELS: Record<string, string> = {
  "541330": "Engineering Services",
  "541511": "Custom Computer Programming",
  "541512": "Computer Systems Design",
  "541519": "Other Computer Related Services",
  "541715": "R&D — Physical Sciences",
  "541990": "Professional Services (Other)",
  "561110": "Office Administrative Services",
  "236220": "Commercial Building Construction",
  "238210": "Electrical Contractors",
  "541611": "Management Consulting",
  "541690": "Scientific & Technical Consulting",
  "518210": "Data Processing & Hosting",
  "511210": "Software Publishers",
  "561320": "Temporary Staffing Services",
  "541380": "Testing Laboratories",
};

function getNaicsLabel(code: string): string {
  return NAICS_LABELS[code] || `NAICS ${code}`;
}

/* ─── Type mapping: DB forecast_type → UI display type ───────────────── */
const TYPE_DISPLAY: Record<string, string> = {
  "renewal_radar": "contract_activity",
  "setaside_depletion": "setaside_opportunities",
  "zero_competition": "low_competition_radar",
};

const TYPE_LABELS: Record<string, string> = {
  "contract_activity": "Contract Activity Forecast",
  "setaside_opportunities": "Set-Aside Opportunities",
  "low_competition_radar": "Low-Competition Radar",
};

const ALLOWED_TYPES = ["renewal_radar", "setaside_depletion", "zero_competition"];

/* ─── Helpers ────────────────────────────────────────────────────────── */

function computeTrend(arr: number[]): { type: "increase" | "decrease" | "stable"; pct: number } {
  if (!arr || arr.length < 2) return { type: "stable", pct: 0 };
  const first = arr[0];
  const last = arr[arr.length - 1];
  if (first === 0 && last === 0) return { type: "stable", pct: 0 };
  if (first === 0) return { type: "increase", pct: 100 };
  const pct = ((last - first) / Math.abs(first)) * 100;
  if (pct > 5) return { type: "increase", pct };
  if (pct < -5) return { type: "decrease", pct };
  return { type: "stable", pct };
}

function mapConfidence(score: number): "high" | "medium" | "low" {
  if (score >= 36) return "high";
  if (score >= 18) return "medium";
  return "low";
}

function generateMonthLabels(startYear: number, startMonth: number, count: number): string[] {
  const labels: string[] = [];
  let y = startYear;
  let m = startMonth;
  for (let i = 0; i < count; i++) {
    const monthName = new Date(y, m - 1).toLocaleString("en-US", { month: "short" });
    labels.push(`${monthName} '${String(y).slice(2)}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return labels;
}

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()             { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    );

    // 1. Auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's NAICS codes from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("naics_codes")
      .eq("id", session.user.id)
      .single();

    const userNaics: string[] = profile?.naics_codes ?? [];

    // 3. Query forecasts — filter to 3 allowed types + user NAICS
    if (userNaics.length === 0) {
      return NextResponse.json({
        forecasts: [],
        generated_at: null,
        engine: "quantile",
        status: "no_data",
      });
    }

    let forecastQuery = supabase
      .from("agency_forecasts")
      .select("id, naics_code, agency_name, forecast_type, predicted_array, quantile_array, confidence_score, insight_text, explainability, predicted_dates, run_date, updated_at")
      .in("forecast_type", ALLOWED_TYPES)
      .in("naics_code", userNaics)
      .order("confidence_score", { ascending: false });

    const { data: forecasts, error: fErr } = await forecastQuery.limit(500);
    if (fErr) throw fErr;
    if (!forecasts || forecasts.length === 0) {
      const { data: statusCheck } = await supabase
        .from("profiles")
        .select("forecast_coldstart_status")
        .eq("id", session.user.id)
        .single();

      if (statusCheck?.forecast_coldstart_status === "pending" ||
          statusCheck?.forecast_coldstart_status === "running") {
        return NextResponse.json({
          forecasts: [],
          status: "generating",
          message: "Your market forecasts are being generated. This usually takes 10-20 minutes.",
          engine: "quantile",
        });
      }

      return NextResponse.json({
        forecasts: [],
        generated_at: null,
        engine: "quantile",
        status: "no_data",
      });
    }

    // 4. Get matching historical volumes for chart context
    const forecastNaics = [...new Set(forecasts.map(f => f.naics_code))];
    const { data: historicals } = await supabase
      .from("historical_volumes")
      .select("naics_code, agency_name, volume_array, setaside_counts, single_bidder_counts, micropurchase_counts, month_labels")
      .in("naics_code", forecastNaics);

    const histLookup = new Map<string, any>();
    if (historicals) {
      for (const h of historicals) {
        histLookup.set(`${h.naics_code}|${h.agency_name}`, h);
      }
    }

    // 5. Query backtest accuracy for transparency
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
    const backtestDateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const { data: backtestRows } = await supabase
      .from("backtest_history")
      .select("naics_code, forecast_type, mape")
      .in("naics_code", forecastNaics)
      .gte("validation_date", backtestDateStr);

    const backtestLookup = new Map<string, { totalMape: number; count: number }>();
    if (backtestRows) {
      for (const b of backtestRows) {
        const key = `${b.naics_code}|${b.forecast_type}`;
        const entry = backtestLookup.get(key) || { totalMape: 0, count: 0 };
        entry.totalMape += Number(b.mape) || 0;
        entry.count += 1;
        backtestLookup.set(key, entry);
      }
    }

    // 6. Transform into ForecastCard shape
    const cards = forecasts.map((f) => {
      const predicted: number[] = f.predicted_array || [];
      const trend = computeTrend(predicted);
      const displayType = TYPE_DISPLAY[f.forecast_type] || f.forecast_type;

      const histKey = `${f.naics_code}|${f.agency_name}`;
      const hist = histLookup.get(histKey);

      const dataPoints: { period: string; historical?: number; projected?: number; p10?: number; p50?: number; p90?: number }[] = [];

      if (hist && hist.month_labels && hist.month_labels.length > 0) {
        let histArray = hist.volume_array || [];
        if (f.forecast_type === "setaside_depletion") histArray = hist.setaside_counts || [];
        else if (f.forecast_type === "zero_competition") histArray = hist.single_bidder_counts || [];

        // Last 12 months of historical (was 6)
        const histSlice = histArray.slice(-12);
        const labelSlice = hist.month_labels.slice(-12);
        for (let i = 0; i < histSlice.length; i++) {
          const label = labelSlice[i];
          const [y, m] = label.split("-").map(Number);
          const monthStr = new Date(y, m - 1).toLocaleString("en-US", { month: "short" });
          dataPoints.push({
            period: `${monthStr} '${String(y).slice(2)}`,
            historical: Math.round(histSlice[i] * 10) / 10,
          });
        }
      }

      let quantileBands: { p10: number[]; p50: number[]; p90: number[] } | undefined;
      if (f.quantile_array && typeof f.quantile_array === "object") {
        const q = f.quantile_array as Record<string, number[]>;
        if (q.p10 && q.p50 && q.p90) {
          quantileBands = {
            p10: q.p10.map(v => Math.round(v * 10) / 10),
            p50: q.p50.map(v => Math.round(v * 10) / 10),
            p90: q.p90.map(v => Math.round(v * 10) / 10),
          };
        }
      }

      let projLabels: string[] = [];
      if (f.predicted_dates && f.predicted_dates.length >= predicted.length) {
        projLabels = f.predicted_dates.slice(0, predicted.length).map((d: string) => {
          const [y, m] = d.split("-").map(Number);
          const monthStr = new Date(y, m - 1).toLocaleString("en-US", { month: "short" });
          return `${monthStr} '${String(y).slice(2)}`;
        });
      } else {
        const now = new Date();
        projLabels = generateMonthLabels(now.getFullYear(), now.getMonth() + 2, predicted.length);
      }

      for (let i = 0; i < predicted.length; i++) {
        dataPoints.push({
          period: projLabels[i] || `M+${i + 1}`,
          projected: Math.round(predicted[i] * 10) / 10,
          p10: quantileBands?.p10[i],
          p50: quantileBands?.p50[i],
          p90: quantileBands?.p90[i],
        });
      }

      const btKey = `${f.naics_code}|${f.forecast_type}`;
      const bt = backtestLookup.get(btKey);
      const backtestAccuracy = bt && bt.count > 0
        ? { mape: Math.round((bt.totalMape / bt.count) * 10) / 10, validations: bt.count }
        : null;

      const explain = (f.explainability && typeof f.explainability === "object")
        ? f.explainability as Record<string, unknown>
        : null;

      const dataPoints_raw = Number(f.confidence_score) || 0;

      return {
        id: f.id,
        naics_code: f.naics_code,
        naics_label: getNaicsLabel(f.naics_code),
        agency_name: f.agency_name || "",
        forecast_type: displayType,
        forecast_type_label: TYPE_LABELS[displayType] || displayType,
        prediction_type: trend.type,
        confidence: mapConfidence(dataPoints_raw),
        percent_change: Math.round(trend.pct * 10) / 10,
        insight_text: f.insight_text || "",
        data_points: dataPoints,
        quantile_bands: quantileBands || undefined,
        data_quality: {
          data_points: dataPoints_raw,
          data_quality: dataPoints_raw >= 36 ? "rich" : dataPoints_raw >= 18 ? "adequate" : "limited",
        },
        backtest_accuracy: backtestAccuracy,
        explainability: explain ? {
          headline: (explain.headline as string) || "",
          pattern: (explain.pattern as string) || "",
          peak_month: (explain.peak_month as string) || "",
          baseline_value: (explain.baseline_value as number) ?? 0,
          peak_multiplier: (explain.peak_multiplier as number) ?? 1,
          trend_pct: (explain.trend_pct as number) ?? 0,
          volatility_pct: (explain.volatility_pct as number) ?? 0,
          data_points: (explain.data_points as number) ?? 0,
          explanation: (explain.explanation as string) || "",
          direction: explain.direction as string | undefined,
          current_monthly_avg: (explain.current_monthly_avg as number) ?? 0,
          predicted_burst: (explain.predicted_burst as number) ?? 0,
          burst_month: explain.burst_month as string | undefined,
          competition_level: explain.competition_level as string | undefined,
          mean_single_bidder: (explain.mean_single_bidder as number) ?? 0,
          total_historical_awards: (explain.total_historical_awards as number) ?? 0,
        } : null,
        run_date: f.run_date || f.updated_at || null,
      };
    });

    const latestUpdate = forecasts.reduce((latest, f) => {
      const t = f.updated_at;
      return t && t > (latest || "") ? t : latest;
    }, "" as string);

    return NextResponse.json({
      forecasts: cards,
      generated_at: latestUpdate || null,
      engine: "quantile",
      status: "ok",
    });
  } catch (err: unknown) {
    console.error("Forecasts API Error:", err);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
