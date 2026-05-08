/**
 * Plexovia — GET /api/user-matches
 * Server-side proxy to engine /api/user/matches.
 *
 * Why a proxy?
 * - Reads the Supabase session from SSR cookies → no NEXT_PUBLIC_ env needed
 * - Forwards the JWT to the engine server-to-server (no CORS constraint)
 * - Dashboard client just calls /api/user-matches (same origin)
 *
 * Supported query params (forwarded): page, per_page, min_score
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()

  // ── Read session from SSR cookies ─────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()              { return cookieStore.getAll() },
        setAll(cookiesToSet)  { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Forward query params ───────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const page      = searchParams.get('page')      || '1'
  const per_page  = searchParams.get('per_page')  || '10'
  const min_score = searchParams.get('min_score') || '0'
  const search    = searchParams.get('search')    || ''
  const sort      = searchParams.get('sort')      || 'score'

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    let url = `${engineUrl}/api/user/matches?page=${page}&per_page=${per_page}&min_score=${min_score}&sort=${sort}`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    const res = await fetch(url,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(25000),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Engine error: ${res.status}`, detail: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/user-matches] Engine fetch failed:', err)
    return NextResponse.json({ error: 'Engine unavailable', matches: [], pagination: { total: 0 } }, { status: 502 })
  }
}
