import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

  const payload = await request.json()

  const engineUrl = process.env.RAILWAY_API_URL
    || process.env.NEXT_PUBLIC_RAILWAY_API_URL
    || 'https://plexovia-engine-production.up.railway.app'
  const internalKey = process.env.INTERNAL_API_KEY || process.env.X_INTERNAL_KEY || ''

  try {
    // Fire and forget
    fetch(`${engineUrl}/api/internal/pipeline/first-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': internalKey,
      },
      body: JSON.stringify({
        user_id: session.user.id,
        naics_codes: payload.naics_codes || [],
        states: payload.states || []
      })
    }).catch(e => console.error('First login pipeline trigger failed', e))

    return NextResponse.json({ status: 'triggered' })
  } catch (err) {
    console.error('[/api/onboarding/first-login] Engine fetch failed:', err)
    return NextResponse.json({ error: 'Engine unavailable' }, { status: 502 })
  }
}
