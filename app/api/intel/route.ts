/**
 * Plexovia — GET /api/intel
 * Server-side proxy to engine /api/user/intel.
 *
 * Returns an aggregated intelligence briefing combining signals,
 * forecasts, and win probabilities.
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
        getAll()              { return cookieStore.getAll() },
        setAll(cookiesToSet)  { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    const res = await fetch(
      `${engineUrl}/api/user/intel?user_id=${session.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Engine error: ${res.status}`, detail: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/intel] Engine fetch failed:', err)
    return NextResponse.json({
      error: 'Engine unavailable',
      briefing: { headline: 'Intelligence briefing unavailable', signals: { count: 0, items: [] }, forecasts: { count: 0, items: [] }, win_probability: { count: 0, items: [] } },
      meta: {}
    }, { status: 502 })
  }
}
