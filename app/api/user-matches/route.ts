/**
 * Plexovia — GET /api/user-matches
 * Queries Supabase directly for the authenticated user's contract matches.
 *
 * Previous architecture proxied through Railway engine, which introduced
 * a fragile network hop (Vercel → Railway → Supabase → back). This caused
 * persistent "Could not load contracts" errors due to timeout/connectivity
 * issues between Vercel serverless functions and Railway.
 *
 * Current architecture: Vercel → Supabase (direct). Same DB, zero Railway
 * dependency for reads. The engine is only needed for WRITES (matching, fetching).
 *
 * Supported query params: page, per_page, min_score, search, sort
 *
 * Data window: only contracts posted within the last 90 days with open
 * deadlines are returned. This matches the FAR standard response window.
 * The 90-day backfill for first-login populates the DB. This API
 * filters display to the actionable 90-day window.
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

  // ── Parse query params ──────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const page      = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const per_page  = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '10', 10)))
  const min_score = Math.max(0, parseInt(searchParams.get('min_score') || '0', 10))
  const search    = searchParams.get('search') || ''
  const sort      = searchParams.get('sort') || 'score'

  const offset = (page - 1) * per_page

  try {
    // ── Build the main query ────────────────────────────────────────────
    const selectClause =
      'id, score, match_reasons, created_at, next_steps, ' +
      'contracts!inner(id, title, url, state, agency, naics_code, psc_code, ' +
      'deadline, posted_date, set_aside)'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('matches')
      .select(selectClause)
      .eq('user_id', session.user.id)
      .gte('score', min_score)

    // Exclude expired contracts — keep NULL deadlines (some SAM.gov listings lack one)
    const todayISO = new Date().toISOString().split('T')[0]
    query = query.or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })

    // 90-day rolling window — only show contracts posted within the last 90 days.
    // This aligns with the FAR standard response window. Keep NULL posted_date
    // to avoid dropping contracts where SAM.gov didn't provide a date.
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const cutoffISO = ninetyDaysAgo.toISOString().split('T')[0]
    query = query.or(`posted_date.gte.${cutoffISO},posted_date.is.null`, { referencedTable: 'contracts' })

    if (search) {
      query = query.ilike('contracts.title', `%${search}%`)
    }

    if (sort === 'posted_date') {
      query = query.order('posted_date', { ascending: false, referencedTable: 'contracts' })
    } else if (sort === 'deadline') {
      query = query.order('deadline', { ascending: true, referencedTable: 'contracts' })
    } else if (sort === 'score') {
      query = query.order('score', { ascending: false })
    } else {
      // Default: newest contracts first (matches must post date DESC, then score DESC)
      query = query.order('posted_date', { ascending: false, referencedTable: 'contracts' })
      query = query.order('score', { ascending: false })
    }

    const { data: rows, error: queryError } = await query.range(offset, offset + per_page - 1)

    if (queryError) {
      console.error('[/api/user-matches] Supabase query error:', queryError)
      return NextResponse.json(
        { error: 'Database query failed', detail: queryError.message },
        { status: 500 }
      )
    }

    // ── Diagnostic: detect orphan matches ──────────────────────────────
    // If the contracts!inner join returns 0 rows but raw matches exist,
    // it means match rows point to deleted/missing contract rows.
    if ((!rows || rows.length === 0) && min_score === 0 && !search) {
      const { count: rawCount } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      if (rawCount && rawCount > 0) {
        console.error(
          `[user-matches] ORPHAN DETECTED: User ${session.user.id} has ${rawCount} match rows ` +
          `but contracts!inner join returned 0. Broken contract_id foreign keys likely.`
        )
      }
    }

    // ── Fetch win probabilities for these matches ─────────────────────
    const matchIds = (rows || []).map((row: any) => row.id)
    const winMap = new Map<string | number, { probability: number; factors: Record<string, number> }>()
    if (matchIds.length > 0) {
      const { data: winData } = await supabase
        .from("win_probability")
        .select("match_id, probability, factors")
        .in("match_id", matchIds)
      if (winData) {
        for (const w of winData) {
          winMap.set(w.match_id, { probability: w.probability, factors: w.factors })
        }
      }
    }

    // ── Format response to match the shape the frontend expects ─────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches = (rows || []).map((row: any) => {
      const contract = Array.isArray(row.contracts) ? (row.contracts[0] || {}) : (row.contracts || {})
      const reasons = row.match_reasons || []

      // Build explanation string from reasons
      const explanationParts = reasons.map((r: string) => {
        if (r.startsWith('naics:')) return `NAICS code ${r.replace('naics:', '')} matched`
        if (r.startsWith('keyword:')) return `Keyword "${r.replace('keyword:', '')}" found in title`
        if (r.startsWith('psc:')) return `PSC code ${r.replace('psc:', '')} matched`
        if (r.startsWith('state:')) return `State ${r.replace('state:', '')} matched`
        return r
      })

      return {
        match_id:    row.id,
        score:       row.score ?? 0,
        explanation: explanationParts.join('. ') || 'Profile match',
        reasons:     reasons,
        matched_at:  row.created_at,
        contract: {
          id:          contract.id ?? null,
          title:       contract.title ?? null,
          url:         contract.url ?? null,
          state:       contract.state ?? null,
          agency:      contract.agency ?? null,
          naics_code:  contract.naics_code ?? null,
          deadline:    contract.deadline ?? null,
          posted_date: contract.posted_date ?? null,

          set_aside:   contract.set_aside ?? null,
          psc_code:    contract.psc_code ?? null,
        },
        win_probability: winMap.get(row.id)?.probability ?? null,
        win_factors: winMap.get(row.id)?.factors ?? null,
        next_steps: row.next_steps || [],
      }
    })

    // ── Count query for pagination ────────────────────────────────────────
    // Must mirror main query filters (including deadline + 90-day posted window)
    // so pagination totals are consistent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery: any = supabase
      .from('matches')
      .select('id, contracts!inner(id)', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('score', min_score)
      .or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })
      .or(`posted_date.gte.${cutoffISO},posted_date.is.null`, { referencedTable: 'contracts' })

    if (search) {
      countQuery = supabase
        .from('matches')
        .select('id, contracts!inner(id, title)', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('score', min_score)
        .or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })
        .or(`posted_date.gte.${cutoffISO},posted_date.is.null`, { referencedTable: 'contracts' })
        .ilike('contracts.title', `%${search}%`)
    }

    const { count: totalCount } = await countQuery
    const total = totalCount ?? 0

    return NextResponse.json({
      matches,
      pagination: {
        page,
        per_page,
        total,
        total_pages: Math.max(1, Math.ceil(total / per_page)),
        has_next:    (offset + per_page) < total,
      },
      user: {
        user_id: session.user.id,
      },
    })
  } catch (err) {
    console.error('[/api/user-matches] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to load matches', matches: [], pagination: { total: 0 } },
      { status: 500 }
    )
  }
}
