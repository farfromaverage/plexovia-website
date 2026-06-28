/**
 * Plexovia — POST /api/pipeline
 *
 * Updates pipeline fields (stage, notes, reference URLs) directly in Supabase
 * using the SSR client (cookie auth). Bypasses Railway's JWT verification
 * which has a known SUPABASE_JWT_SECRET mismatch with the Supabase project.
 *
 * Replaces: engineFetch → Railway PATCH /api/user/pipeline/{match_id}
 * Pattern:  identical to POST /api/bookmark (server-side Supabase write)
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_STAGES = [
  "qualifying", "pursuing", "proposal_in_progress",
  "submitted", "awarded", "not_awarded", "no_bid",
];

const URL_RE = /^https?:\/\/\S+$/;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { match_id, pipeline_stage, pipeline_notes, reference_urls } =
      await request.json();

    if (!match_id) {
      return NextResponse.json({ error: "match_id required" }, { status: 400 });
    }

    // Validate pipeline_stage if provided
    if (pipeline_stage !== undefined && !VALID_STAGES.includes(pipeline_stage)) {
      return NextResponse.json(
        { error: `Invalid stage: ${pipeline_stage}` },
        { status: 400 }
      );
    }

    // Validate pipeline_notes length if provided
    if (pipeline_notes !== undefined && pipeline_notes.length > 10000) {
      return NextResponse.json(
        { error: "pipeline_notes exceeds 10000 characters" },
        { status: 400 }
      );
    }

    // Validate reference_urls if provided
    if (reference_urls !== undefined) {
      if (!Array.isArray(reference_urls)) {
        return NextResponse.json(
          { error: "reference_urls must be an array" },
          { status: 400 }
        );
      }
      if (reference_urls.length > 20) {
        return NextResponse.json(
          { error: "reference_urls exceeds 20 URLs" },
          { status: 400 }
        );
      }
      for (const url of reference_urls) {
        if (typeof url !== "string" || url.length > 2048 || !URL_RE.test(url)) {
          return NextResponse.json(
            { error: `Invalid URL: ${url}` },
            { status: 400 }
          );
        }
      }
    }

    // Build update fields — only include provided fields
    const updateFields: Record<string, unknown> = {};
    if (pipeline_stage !== undefined) updateFields.pipeline_stage = pipeline_stage;
    if (pipeline_notes !== undefined) updateFields.pipeline_notes = pipeline_notes;
    if (reference_urls !== undefined) updateFields.reference_urls = reference_urls;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ message: "No fields to update" });
    }

    updateFields.pipeline_updated_at = new Date().toISOString();

    // Update with ownership check (RLS: matches_owner_update policy enforces user_id match)
    const { error: updateError } = await supabase
      .from("matches")
      .update(updateFields)
      .eq("id", match_id)
      .eq("user_id", session.user.id);

    if (updateError) {
      console.error("[pipeline] update failed:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      match_id,
      pipeline_stage: updateFields.pipeline_stage,
      pipeline_notes: updateFields.pipeline_notes,
      pipeline_updated_at: updateFields.pipeline_updated_at,
      message: "Pipeline updated.",
    });
  } catch (err) {
    console.error("[pipeline] unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
