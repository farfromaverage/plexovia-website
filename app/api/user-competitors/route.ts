/**
 * Plexovia — GET /api/user-competitors
 * Server-side proxy to engine /api/user/competitors.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getTeamRole, canWriteData } from '@/lib/team'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll() },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    const res = await fetch(
      `${engineUrl}/api/user/competitors`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (res.status === 403) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Engine error ${res.status}` }, { status: res.status })
    }

    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[/api/user-competitors GET]', err)
    return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll() },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getTeamRole(supabase, session.user.id);
  if (!canWriteData(role)) {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot add competitors' }, { status: 403 })
  }

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    const body = await request.json()
    const res = await fetch(
      `${engineUrl}/api/user/competitors/track`,
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (res.status === 403) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Engine error ${res.status}` }, { status: res.status })
    }

    return NextResponse.json(await res.json())
  } catch (err) {
    console.error('[/api/user-competitors POST]', err)
    return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}
