/**
 * Plexovia — GET /api/forecasts
 * Production-grade forecast API that:
 *   1. Authenticates the user via Supabase session
 *   2. Reads the user's saved NAICS codes from their profile
 *   3. Queries agency_forecasts + historical_volumes for those NAICS codes
 *   4. Transforms raw DB rows into the ForecastCard shape the dashboard expects
 *      (with historical + projected chart data, trend analysis, NAICS labels)
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── NAICS Code → Human Label Mapping ────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
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

    // 3. Query forecasts — filter by user's NAICS if set, otherwise show all
    let forecastQuery = supabase
      .from("agency_forecasts")
      .select("id, naics_code, agency_name, forecast_type, predicted_array, confidence_score, insight_text, predicted_dates, updated_at")
      .order("confidence_score", { ascending: false });

    if (userNaics.length > 0) {
      forecastQuery = forecastQuery.in("naics_code", userNaics);
    }

    const { data: forecasts, error: fErr } = await forecastQuery.limit(50);
    if (fErr) throw fErr;
    if (!forecasts || forecasts.length === 0) {
      return NextResponse.json({
        forecasts: [],
        generated_at: null,
        model: "TimesFM 2.5",
        status: "no_data",
      });
    }

    // 4. Get matching historical volumes for chart context
    const forecastNaics = [...new Set(forecasts.map(f => f.naics_code))];
    const { data: historicals } = await supabase
      .from("historical_volumes")
      .select("naics_code, agency_name, volume_array, month_labels")
      .in("naics_code", forecastNaics);

    // Build lookup: "naics_code|agency_name" -> historical data
    const histLookup = new Map<string, { volume_array: number[]; month_labels: string[] }>();
    if (historicals) {
      for (const h of historicals) {
        histLookup.set(`${h.naics_code}|${h.agency_name}`, {
          volume_array: h.volume_array || [],
          month_labels: h.month_labels || [],
        });
      }
    }

    // 5. Transform into ForecastCard shape
    const cards = forecasts.map((f) => {
      const predicted: number[] = f.predicted_array || [];
      const conf = Number(f.confidence_score) || 0;
      const trend = computeTrend(predicted);

      // Build chart data points: last 6 months historical + projected
      const histKey = `${f.naics_code}|${f.agency_name}`;
      const hist = histLookup.get(histKey);

      const dataPoints: { period: string; historical?: number; projected?: number }[] = [];

      if (hist && hist.volume_array.length > 0 && hist.month_labels.length > 0) {
        // Last 6 months of historical
        const histSlice = hist.volume_array.slice(-6);
        const labelSlice = hist.month_labels.slice(-6);
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

      // Projected months
      if (predicted.length > 0) {
        // Use predicted_dates if available, otherwise generate from last historical date
        let projLabels: string[] = [];
        if (f.predicted_dates && f.predicted_dates.length >= predicted.length) {
          projLabels = f.predicted_dates.slice(0, predicted.length).map((d: string) => {
            const [y, m] = d.split("-").map(Number);
            const monthStr = new Date(y, m - 1).toLocaleString("en-US", { month: "short" });
            return `${monthStr} '${String(y).slice(2)}`;
          });
        } else {
          // Fallback: generate labels from current date
          const now = new Date();
          projLabels = generateMonthLabels(now.getFullYear(), now.getMonth() + 2, predicted.length);
        }

        for (let i = 0; i < predicted.length; i++) {
          dataPoints.push({
            period: projLabels[i] || `M+${i + 1}`,
            projected: Math.round(predicted[i] * 10) / 10,
          });
        }
      }

      return {
        id: f.id,
        naics_code: f.naics_code,
        naics_label: getNaicsLabel(f.naics_code),
        prediction_type: trend.type,
        confidence: mapConfidence(conf),
        percent_change: Math.round(trend.pct * 10) / 10,
        insight_text: f.insight_text || "",
        data_points: dataPoints,
        generated_at: f.updated_at || null,
      };
    });

    // Find most recent generation timestamp
    const latestUpdate = forecasts.reduce((latest, f) => {
      const t = f.updated_at;
      return t && t > (latest || "") ? t : latest;
    }, "" as string);

    return NextResponse.json({
      forecasts: cards,
      generated_at: latestUpdate || null,
      model: "TimesFM 2.5",
      status: "ok",
    });
  } catch (err: unknown) {
    console.error("Forecasts API Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
