/**
 * Plexovia — GET /api/win-prob
 * Server-side proxy to engine /api/user/win-prob.
 *
 * Supported query params (forwarded): naics_code, min_probability, limit
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

  const { searchParams } = new URL(request.url)
  const naics_code      = searchParams.get('naics_code')      || ''
  const min_probability = searchParams.get('min_probability') || '0'
  const limit           = searchParams.get('limit')           || '50'

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  const params = new URLSearchParams({ user_id: session.user.id, min_probability, limit })
  if (naics_code) params.set('naics_code', naics_code)

  try {
    const res = await fetch(
      `${engineUrl}/api/user/win-prob?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Engine error: ${res.status}`, detail: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/win-prob] Engine fetch failed:', err)
    return NextResponse.json({ error: 'Engine unavailable', predictions: [], meta: {} }, { status: 502 })
  }
}
