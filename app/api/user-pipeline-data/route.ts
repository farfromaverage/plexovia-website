/**
 * Plexovia — GET /api/user-pipeline-data
 *
 * Returns pipeline data (bookmarked matches grouped by stage) using the
 * Supabase SSR client (cookie auth). Used as a fallback when the Railway
 * backend's JWT verification is failing (SUPABASE_JWT_SECRET mismatch).
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function formatValueRange(vmin: number | null, vmax: number | null): string {
  const fmt = (n: number | null): string | null => {
    if (n == null) return null;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  const a = fmt(vmin);
  const b = fmt(vmax);
  if (a && b && a !== b) return `${a}\u2013${b}`;
  return a || b || "";
}

const VALID_STAGES = [
  "qualifying", "pursuing", "proposal_in_progress",
  "submitted", "awarded", "not_awarded", "no_bid",
];

const STAGE_LABELS: Record<string, string> = {
  qualifying: "Qualifying",
  pursuing: "Pursuing",
  proposal_in_progress: "Proposal In Progress",
  submitted: "Submitted",
  awarded: "Awarded",
  not_awarded: "Not Awarded",
  no_bid: "No Bid",
};

interface MatchRow {
  id: string;
  pipeline_stage: string | null;
  pipeline_notes: string | null;
  reference_urls: string[] | null;
  pipeline_updated_at: string | null;
  score: number | null;
  match_reasons: string[] | null;
  contracts: Array<Record<string, unknown>>;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: _data, error } = await supabase
      .from("matches")
      .select(
        "id, pipeline_stage, pipeline_notes, reference_urls, " +
        "pipeline_updated_at, score, match_reasons, saved, " +
        "contracts(id, external_id, title, agency, naics_code, psc_code, fed_org_code, " +
        "state, deadline, set_aside, url, posted_date, value_min, value_max)"
      )
      .eq("user_id", session.user.id)
      .eq("saved", true)
      .order("pipeline_updated_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    const rows = (_data || []) as unknown as MatchRow[];
    const columns: Record<string, { stage: string; label: string; count: number; items: any[] }> = {};
    for (const s of VALID_STAGES) {
      columns[s] = { stage: s, label: STAGE_LABELS[s], count: 0, items: [] };
    }

    for (const row of rows) {
      let stage = row.pipeline_stage || "qualifying";
      // Legacy "identified" stage no longer exists — map to qualifying.
      if (stage === "identified") stage = "qualifying";
      if (!columns[stage]) continue;
      const c = (Array.isArray(row.contracts) ? row.contracts[0] : row.contracts) || {};
      const vmin = (c as any).value_min ?? null;
      const vmax = (c as any).value_max ?? null;
      const valueRange = formatValueRange(vmin, vmax);

      columns[stage].items.push({
        match_id: row.id,
        pipeline_stage: stage,
        pipeline_notes: row.pipeline_notes || "",
        reference_urls: row.reference_urls || [],
        pipeline_updated_at: row.pipeline_updated_at,
        score: row.score || 0,
        match_reasons: row.match_reasons || [],
        density_label: "",
        naics_title: "",
        psc_title: "",
        solicitation_number: (c as any).external_id || "",
        title: (c as any).title || "Untitled",
        agency: (c as any).agency || "",
        naics_code: (c as any).naics_code || "",
        psc_code: (c as any).psc_code || "",
        fed_org_code: (c as any).fed_org_code || "",
        state: (c as any).state || "",
        deadline: (c as any).deadline || null,
        set_aside: (c as any).set_aside || "",
        url: (c as any).url || null,
        posted_date: (c as any).posted_date || null,
        value_min: vmin,
        value_max: vmax,
        value_range: valueRange,
      });
    }

    for (const col of Object.values(columns)) {
      col.count = col.items.length;
    }

    const total = rows.length;
    const submitted = columns["submitted"].count;
    const awarded = columns["awarded"].count;
    const not_awarded = columns["not_awarded"].count;
    const no_bid_count = columns["no_bid"].count;
    const active = columns["qualifying"].count + columns["pursuing"].count + columns["proposal_in_progress"].count;
    const denom = awarded + not_awarded;

    const lastUpdated = rows
      .map(r => r.pipeline_updated_at)
      .filter(Boolean)
      .sort()
      .pop() || null;

    return NextResponse.json({
      stages: VALID_STAGES.map(s => columns[s]),
      scorecard: {
        total_tracked: total,
        active_pursuits: active,
        proposals_submitted: submitted,
        wins: awarded,
        not_awarded: not_awarded,
        no_bid: no_bid_count,
        win_rate: denom > 0 ? Math.round((awarded / denom) * 100 * 10) / 10 : null,
      },
      last_updated: lastUpdated,
      diagnostics: total === 0
        ? ["No bookmarked contracts yet. Save contracts from the Discover page to start tracking them here."]
        : [],
    });
  } catch (err) {
    console.error("[user-pipeline-data] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
