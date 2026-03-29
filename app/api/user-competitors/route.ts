/**
 * Plexovia — GET /api/user-competitors
 * Server-side proxy to engine /api/user/competitors.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

  const { searchParams } = new URL(request.url)
  const days  = searchParams.get('days')  || '90'
  const limit = searchParams.get('limit') || '20'

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    const res = await fetch(
      `${engineUrl}/api/user/competitors?days=${days}&limit=${limit}`,
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
    console.error('[/api/user-competitors]', err)
    return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}
