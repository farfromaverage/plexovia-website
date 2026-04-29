import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getTeamRole, canManageTeam } from "@/lib/team";

const RAILWAY_URL = process.env.RAILWAY_API_URL || "http://127.0.0.1:8000";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getTeamRole(supabase, session.user.id);
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Forbidden: Only admins can manage the team" }, { status: 403 });
  }

  const id = (await params).id;
  try {
    const body = await request.json();
    const res = await fetch(`${RAILWAY_URL}/api/team/members/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok && body.role) {
      // Log role change
      const { data: targetProfile } = await supabase.from('team_profiles').select('org_id, email, invited_email, member_id').eq('id', id).single();
      if (targetProfile) {
        await supabase.from('team_activity_log').insert({
          org_id: targetProfile.org_id,
          actor_user_id: session.user.id,
          actor_email: session.user.email,
          action: `role_changed_to_${body.role}`,
          target_email: targetProfile.email || targetProfile.invited_email,
          target_user_id: targetProfile.member_id
        });
      }
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "API connection failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getTeamRole(supabase, session.user.id);
  if (!canManageTeam(role)) {
    return NextResponse.json({ error: "Forbidden: Only admins can manage the team" }, { status: 403 });
  }

  const id = (await params).id;
  try {
    // We fetch the profile first to know the details before it is deleted
    const { data: targetProfile } = await supabase.from('team_profiles').select('org_id, email, invited_email, member_id').eq('id', id).single();

    const res = await fetch(`${RAILWAY_URL}/api/team/members/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    });
    const data = await res.json();

    if (res.ok && targetProfile) {
      await supabase.from('team_activity_log').insert({
        org_id: targetProfile.org_id,
        actor_user_id: session.user.id,
        actor_email: session.user.email,
        action: 'member_deactivated',
        target_email: targetProfile.email || targetProfile.invited_email,
        target_user_id: targetProfile.member_id
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "API connection failed" }, { status: 500 });
  }
}
