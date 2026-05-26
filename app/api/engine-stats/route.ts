/**
 * Plexovia — GET /api/engine-stats
 * Server-side proxy to the Railway engine's /api/stats endpoint.
 *
 * Why a proxy instead of a direct client-side fetch?
 * - No CORS constraints: server → server bypass.
 * - NEXT_PUBLIC_RAILWAY_API_URL is not required on the client bundle.
 * - Allows caching at the CDN level (revalidate: 300s).
 * - Falls back gracefully if engine is unreachable.
 */

import { NextResponse } from 'next/server'

// Force dynamic rendering to bypass Vercel static cache sticking on stale data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    const res = await fetch(`${engineUrl}/api/stats`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      // 5s timeout via AbortController
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // Engine is down — return fallback so landing page stays functional
    return NextResponse.json({
      total_contracts: 15847,
      federal_sources: 1,
      last_run_at: null,
      portals_monitored: 1,
      recent_contracts: [],
      _fallback: true,
    })
  }
}
