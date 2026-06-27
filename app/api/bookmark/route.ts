/**
 * Plexovia — POST /api/bookmark
 *
 * Toggles the bookmark (saved) state of a match and auto-advances
 * the match to the "qualifying" pipeline stage when bookmarked.
 *
 * Replaces the Railway backend PATCH /api/user/matches/{id}/feedback
 * endpoint which is unreachable due to a JWT verification mismatch
 * (SUPABASE_JWT_SECRET on Railway does not match the Supabase project).
 * Uses the Supabase SSR client (cookie-based auth) which works correctly.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { match_id, saved } = await request.json();
    if (!match_id) {
      return NextResponse.json({ error: "match_id required" }, { status: 400 });
    }
    if (typeof saved !== "boolean") {
      return NextResponse.json({ error: "saved must be a boolean" }, { status: 400 });
    }

    // 1. Verify match belongs to user and fetch current pipeline_stage
    const { data: matchRow, error: findError } = await supabase
      .from("matches")
      .select("id, user_id, pipeline_stage, contracts(naics_code, agency)")
      .eq("id", match_id)
      .eq("user_id", session.user.id)
      .single();

    if (findError || !matchRow) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // 2. Build update fields
    const updateFields: Record<string, unknown> = {
      saved: saved,
      feedback_at: new Date().toISOString(),
    };

    // 3. Auto-advance: when saving a match without a stage, set to qualifying
    if (saved && !matchRow.pipeline_stage) {
      updateFields.pipeline_stage = "qualifying";
      updateFields.pipeline_updated_at = updateFields.feedback_at;
    }

    // 4. Update the match row
    const { error: updateError } = await supabase
      .from("matches")
      .update(updateFields)
      .eq("id", match_id)
      .eq("user_id", session.user.id);

    if (updateError) {
      console.error("[bookmark] update failed:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // 5. Best-effort: update NAICS weight and agency affinity RPCs
    const contractData = Array.isArray(matchRow.contracts)
      ? matchRow.contracts[0]
      : matchRow.contracts;
    const naicsCode = (contractData as { naics_code?: string } | null)?.naics_code || "unknown";
    const agency = (contractData as { agency?: string } | null)?.agency || "";

    (async () => {
      try {
        await supabase.rpc("update_naics_weight", {
          p_user_id: session.user.id,
          p_naics_code: naicsCode,
          p_clicked: saved,
          p_saved: saved,
        });
      } catch { /* best-effort */ }
    })();

    if (agency.trim()) {
      (async () => {
        try {
          await supabase.rpc("update_agency_affinity", {
            p_user_id: session.user.id,
            p_agency: agency.trim(),
            p_clicked: saved,
            p_saved: saved,
          });
        } catch { /* best-effort */ }
      })();
    }

    return NextResponse.json({
      match_id,
      saved,
      pipeline_stage: updateFields.pipeline_stage || matchRow.pipeline_stage || null,
      message: saved ? "Bookmarked" : "Bookmark removed",
    });
  } catch (err) {
    console.error("[bookmark] unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
