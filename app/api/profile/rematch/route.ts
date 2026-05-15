/**
 * Plexovia — POST /api/profile/rematch
 *
 * Triggers re-matching for the current user after they update their profile.
 * Proxies the request to the Railway engine's /api/internal/pipeline/profile-update
 * endpoint, which re-evaluates all active contracts against the updated profile
 * and purges stale matches (e.g., removed NAICS codes).
 *
 * This is NOT fire-and-forget — we await the engine response and return the
 * actual status to the caller so the frontend can show accurate feedback.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
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
  const internalKey = process.env.INTERNAL_API_KEY || process.env.X_INTERNAL_KEY || ''

  // Retry with exponential backoff (3 attempts)
  const MAX_RETRIES = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${engineUrl}/api/internal/pipeline/profile-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify({
          user_id: session.user.id,
        }),
        signal: AbortSignal.timeout(15000), // 15s timeout per attempt
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({ status: 'triggered', ...data })
      }

      // Non-retryable HTTP errors (auth, bad request)
      if (response.status === 403 || response.status === 400) {
        const errText = await response.text().catch(() => 'Unknown error')
        return NextResponse.json(
          { error: `Engine rejected request: ${errText}` },
          { status: response.status }
        )
      }

      lastError = new Error(`Engine returned ${response.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }

    // Exponential backoff: 1s, 2s (only between retries, not after last)
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }

  console.error('[/api/profile/rematch] All retry attempts failed:', lastError?.message)
  return NextResponse.json(
    { error: 'Engine temporarily unavailable. Your matches will update on the next daily run.' },
    { status: 502 }
  )
}
