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

// Cache this route on the CDN for 5 minutes — stats don't change per-second
export const revalidate = 300

export async function GET() {
  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'

  try {
    const res = await fetch(`${engineUrl}/api/stats`, {
      headers: { 'Content-Type': 'application/json' },
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
      states_covered: 50,
      last_run_at: null,
      portals_monitored: 51,
      _fallback: true,
    })
  }
}
