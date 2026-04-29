import { SupabaseClient } from '@supabase/supabase-js'

export type Role = "owner" | "admin" | "member" | "viewer"

export async function getTeamRole(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('team_profiles')
    .select('role')
    .eq('member_id', userId)
    .eq('status', 'active')
    .single()
  
  if (data) return data.role;
  return 'owner'; // default to owner
}

export function canManageTeam(role: string | null) {
  return role === 'owner' || role === 'admin'
}

export function canWriteData(role: string | null) {
  return role === 'owner' || role === 'admin' || role === 'member'
}
