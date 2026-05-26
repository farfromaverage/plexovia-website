/**
 * Plexovia — /api/onboarding/first-login
 *
 * POST: Triggers the first-login pipeline on the Railway engine for a new user.
 * This fetches contracts for the user's NAICS codes (if insufficient exist)
 * and runs the matching engine so the user sees matches on their first
 * dashboard visit.
 *
 * GET: Proxies /api/internal/fed-orgs from the Railway engine to provide
 * the list of federal organizations for the onboarding Fed Orgs step.
 *
 * PRODUCTION FIX: Previously this was fire-and-forget (unawaited fetch with
 * .catch()). If Railway was slow/down, the user landed on an empty dashboard
 * with no retry, no error, and no feedback. Now we:
 *   1. Await the engine response with a 20s timeout
 *   2. Retry up to 3 times with exponential backoff (1s, 2s)
 *   3. Return the actual success/failure status to the caller
 *   4. The onboarding page uses this status to show accurate feedback
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const engineUrl = process.env.RAILWAY_API_URL
      || process.env.NEXT_PUBLIC_RAILWAY_API_URL
      || 'https://plexovia-engine-production.up.railway.app'
    const internalKey = process.env.INTERNAL_API_KEY || process.env.X_INTERNAL_KEY || ''

    const engineRes = await fetch(`${engineUrl}/api/internal/fed-orgs`, {
      headers: { 'x-internal-key': internalKey },
      signal: AbortSignal.timeout(10_000),
    })

    if (!engineRes.ok) throw new Error(`Engine returned ${engineRes.status}`)
    return NextResponse.json(await engineRes.json())
  } catch (error) {
    console.error('[first-login] fed-orgs proxy failed:', error)
    return NextResponse.json({ agencies: [] }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'
  const internalKey = process.env.INTERNAL_API_KEY || process.env.X_INTERNAL_KEY || ''

  const requestBody = JSON.stringify({
    user_id: session.user.id,
    naics_codes: payload.naics_codes || [],
    states: payload.states || [],
  })

  // Retry with exponential backoff (3 attempts, 20s timeout each)
  const MAX_RETRIES = 3
  let lastError: string = 'Unknown error'

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${engineUrl}/api/internal/pipeline/first-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: requestBody,
        signal: AbortSignal.timeout(20000), // 20s timeout per attempt
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({ status: 'triggered', attempt, ...data })
      }

      // Non-retryable errors
      if (response.status === 403) {
        console.error('[first-login] Engine rejected: 403 Forbidden — check INTERNAL_API_KEY')
        return NextResponse.json(
          { error: 'Engine authentication failed', status: 'auth_error' },
          { status: 502 }
        )
      }

      lastError = `Engine returned HTTP ${response.status}`
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }

    // Exponential backoff between retries (not after last attempt)
    if (attempt < MAX_RETRIES) {
      console.warn(`[first-login] Attempt ${attempt} failed: ${lastError}. Retrying in ${attempt}s...`)
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }

  // All retries exhausted — return failure so frontend can handle gracefully
  console.error(`[first-login] All ${MAX_RETRIES} attempts failed: ${lastError}`)
  return NextResponse.json(
    {
      status: 'failed',
      error: 'Matching engine temporarily unavailable. Your matches will appear within 24 hours.',
      attempts: MAX_RETRIES,
    },
    { status: 202 } // 202 Accepted — profile is saved, matching will happen on daily run
  )
}
