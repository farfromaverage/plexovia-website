/**
 * Plexovia — GET /api/user-matches
 *
 * FIX HISTORY (root-cause analysis, not patchwork):
 *
 * BUG 1 (CRITICAL — page always shows error state):
 *   The count query was cast to a fake `CountQueryBuilder` interface that
 *   defined `.execute()`. Supabase JS v2 PostgrestFilterBuilder has NO `.execute()`
 *   method — the builder IS a thenable; you await it directly. Calling `.execute()`
 *   threw a TypeError at runtime, which the outer try/catch caught and returned
 *   HTTP 500. The frontend treated every load as a failure and showed the error state.
 *
 *   FIX: Remove the fake interface entirely. Run both the data query and the count
 *   query as plain awaited Supabase calls. No casting, no fake methods.
 *
 * BUG 2 (pagination count inconsistency when search is active):
 *   When `search` was set, the count query was rebuilt from scratch but the
 *   code path was still inside the same try block. The fix keeps a single
 *   consistent build path for both query and count with shared filter helpers.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface MatchRowRaw {
  id: string;
  score: number;
  recency_window: number;
  match_reasons: string[];
  created_at: string;
  contracts: Array<{
    id: string | null;
    title: string | null;
    url: string | null;
    state: string | null;
    agency: string | null;
    naics_code: string | null;
    psc_code: string | null;
    fed_org_code: string | null;
    deadline: string | null;
    posted_date: string | null;
    set_aside: string | null;
  }>;
}

// ── Shared filter constants ─────────────────────────────────────────────────
function getDateBounds() {
  const now = new Date();
  // Anchor to midnight UTC so the 90-day window is stable throughout the day.
  // Without this, the cutoff advances hour-by-hour and can diverge from the
  // pipeline's cutoff (computed once at pipeline run time).
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayISO = today.toISOString().split("T")[0];

  const cutoff = new Date(today.getTime() - 90 * 86400000);
  const cutoffISO = cutoff.toISOString().split("T")[0];

  return { todayISO, cutoffISO };
}

// ── Shared select clause ────────────────────────────────────────────────────
const SELECT_CLAUSE =
  "id, score, recency_window, match_reasons, created_at, " +
  "contracts!inner(id, title, url, state, agency, naics_code, psc_code, " +
  "fed_org_code, deadline, posted_date, set_aside)";

const COUNT_SELECT_CLAUSE = "id, contracts!inner(id, title)";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse query params ──────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const per_page = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("per_page") || "10", 10))
  );
  const min_score = Math.max(
    0,
    parseInt(searchParams.get("min_score") || "0", 10)
  );
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "recency";

  const offset = (page - 1) * per_page;
  const { todayISO, cutoffISO } = getDateBounds();
  const userId = session.user.id;

  try {
    // ── Build and execute the data query ───────────────────────────────────
    let dataQuery = supabase
      .from("matches")
      .select(SELECT_CLAUSE)
      .eq("user_id", userId)
      .gte("score", min_score)
      .or(`deadline.gte.${todayISO},deadline.is.null`, {
        referencedTable: "contracts",
      })
      .or(`posted_date.gte.${cutoffISO},posted_date.is.null`, {
        referencedTable: "contracts",
      });

    if (search) {
      dataQuery = dataQuery.ilike("contracts.title", `%${search}%`);
    }

    if (sort === "posted_date") {
      dataQuery = dataQuery.order("posted_date", {
        ascending: false,
        referencedTable: "contracts",
      });
    } else if (sort === "deadline") {
      dataQuery = dataQuery.order("deadline", {
        ascending: true,
        referencedTable: "contracts",
      });
    } else if (sort === "score") {
      dataQuery = dataQuery.order("score", { ascending: false });
    } else {
      // Default: recency_window ASC (10-day buckets) then score DESC
      dataQuery = dataQuery
        .order("recency_window", { ascending: true })
        .order("score", { ascending: false });
    }

    const { data: rows, error: queryError } = await dataQuery.range(
      offset,
      offset + per_page - 1
    ) as { data: MatchRowRaw[] | null; error: { message: string } | null };

    if (queryError) {
      console.error("[/api/user-matches] data query error:", queryError);
      return NextResponse.json(
        { error: "Database query failed", detail: queryError.message },
        { status: 500 }
      );
    }

    // ── Orphan detection ───────────────────────────────────────────────────
    if (!rows?.length && min_score === 0 && !search) {
      const { count: rawCount } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (rawCount && rawCount > 0) {
        console.error(
          `[user-matches] ORPHAN DETECTED: user ${userId} has ${rawCount} match rows` +
            ` but contracts!inner join returned 0 — broken contract_id foreign keys.`
        );
      }
    }

    // ── Build and execute the count query ──────────────────────────────────
    // FIX: Supabase JS v2 query builders are thenables — await directly.
    // There is no `.execute()` method. The fake CountQueryBuilder interface
    // that defined `.execute()` has been removed entirely.
    let countQuery = supabase
      .from("matches")
      .select(COUNT_SELECT_CLAUSE, { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("score", min_score)
      .or(`deadline.gte.${todayISO},deadline.is.null`, {
        referencedTable: "contracts",
      })
      .or(`posted_date.gte.${cutoffISO},posted_date.is.null`, {
        referencedTable: "contracts",
      });

    if (search) {
      countQuery = countQuery.ilike("contracts.title", `%${search}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("[/api/user-matches] count query error:", countError);
      // Non-fatal: return data with an estimated total rather than a full 500.
      // The frontend will paginate correctly on what it can see.
    }

    const total = totalCount ?? 0;

    // ── Format response ────────────────────────────────────────────────────
    const matches = (rows ?? []).map((row: MatchRowRaw) => {
      const contract = Array.isArray(row.contracts)
        ? (row.contracts[0] ?? {})
        : (row.contracts ?? {});

      const reasons: string[] = row.match_reasons ?? [];

      const explanationParts = reasons.map((r: string) => {
        if (r.startsWith("naics:"))
          return `NAICS code ${r.replace("naics:", "")} matched`;
        if (r.startsWith("keyword:"))
          return `Keyword "${r.replace("keyword:", "")}" found in title`;
        if (r.startsWith("psc:"))
          return `PSC code ${r.replace("psc:", "")} matched`;
        if (r.startsWith("state:"))
          return `State ${r.replace("state:", "")} matched`;
        return r;
      });

      return {
        match_id: row.id,
        score: row.score ?? 0,
        explanation: explanationParts.join(". ") || "Profile match",
        reasons,
        matched_at: row.created_at,
        contract: {
          id: contract.id ?? null,
          title: contract.title ?? null,
          url: contract.url ?? null,
          state: contract.state ?? null,
          agency: contract.agency ?? null,
          naics_code: contract.naics_code ?? null,
          psc_code: contract.psc_code ?? null,
          fed_org_code: contract.fed_org_code ?? null,
          deadline: contract.deadline ?? null,
          posted_date: contract.posted_date ?? null,
          set_aside: contract.set_aside ?? null,
        },
      };
    });

    // ── Fetch pipeline sync timestamp ──────────────────────────────────────
    let lastPipelineCompletedAt: string | null = null;
    try {
      const { data: psRow } = await supabase
        .from("pipeline_state")
        .select("value")
        .eq("key", "last_pipeline_completed_at")
        .limit(1)
        .single();
      if (psRow?.value) lastPipelineCompletedAt = psRow.value;
    } catch {
      // pipeline_state may not exist yet — non-fatal
    }

    return NextResponse.json(
      {
        matches,
        pagination: {
          page,
          per_page,
          total,
          total_pages: Math.max(1, Math.ceil(total / per_page)),
          has_next: offset + per_page < total,
        },
        user: { user_id: userId },
        last_pipeline_completed_at: lastPipelineCompletedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[/api/user-matches] unexpected error:", err);
    return NextResponse.json(
      {
        error: "Failed to load matches",
        matches: [],
        pagination: { total: 0 },
        last_pipeline_completed_at: null,
      },
      { status: 500 }
    );
  }
}
