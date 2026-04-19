/**
 * Plexovia — GET /api/signals
 * Server-side proxy to engine /api/user/signals.
 *
 * Reads the Supabase session from SSR cookies and forwards the user_id
 * to the engine. Dashboard client calls /api/signals (same origin).
 *
 * Supported query params (forwarded): signal_type, severity, limit
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
  const signal_type = searchParams.get('signal_type') || ''
  const severity    = searchParams.get('severity')    || ''
  const limit       = searchParams.get('limit')       || '50'

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  const params = new URLSearchParams({ user_id: session.user.id, limit })
  if (signal_type) params.set('signal_type', signal_type)
  if (severity)    params.set('severity', severity)

  try {
    const res = await fetch(
      `${engineUrl}/api/user/signals?${params.toString()}`,
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
    console.error('[/api/signals] Engine fetch failed:', err)
    return NextResponse.json({ error: 'Engine unavailable', signals: [], meta: {} }, { status: 502 })
  }
}
