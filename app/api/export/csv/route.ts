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
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // ── Parse days parameter (1–90, default 30) ──────────────────────────
  const { searchParams } = new URL(request.url)
  const daysParam = parseInt(searchParams.get('days') || '30', 10)
  const days = Math.min(90, Math.max(1, isNaN(daysParam) ? 30 : daysParam))

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayISO = new Date().toISOString().split('T')[0]
  const { data, error } = await (supabase as any)
    .from('matches')
    .select(
      'score, match_reasons, created_at, ' +
      'contracts!inner(title, state, naics_code, psc_code, ' +
      'set_aside, deadline, posted_date, url)'
    )
    .eq('user_id', session.user.id)
    .gte('created_at', cutoffDate.toISOString())
    .or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })
    .order('score', { ascending: false })

  if (error) {
    console.error('[/api/export/csv] Supabase error:', error)
    return new NextResponse('Database Error', { status: 500 })
  }

  const matches = data || []

  // ── Fetch win probabilities for exported matches ─────────────────
  const matchIds = matches.map((m: any) => m.id)
  const winMap = new Map<string | number, number>()
  if (matchIds.length > 0) {
    const { data: winData } = await (supabase as any)
      .from('win_probability')
      .select('match_id, probability')
      .in('match_id', matchIds)
    if (winData) {
      for (const w of winData) {
        winMap.set(w.match_id, w.probability)
      }
    }
  }

  // ── CSV column order (exactly as specified, no keywords) ─────────────
  const headers = [
    'Score',
    'Win Probability',
    'Title',
    'NAICS Code',
    'PSC Code',
    'State',
    'Set-Aside',
    'Posted Date',
    'Deadline',
    'Matched Date',
    'URL',
  ]

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const s = String(val).replace(/"/g, '""')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s}"`
      : s
  }

  const fmtDate = (d: string | null): string => {
    if (!d) return ''
    try {
      return new Date(d).toISOString().split('T')[0]
    } catch {
      return d
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = matches.map((m: any) => {
    const c = Array.isArray(m.contracts)
      ? (m.contracts[0] || {})
      : (m.contracts || {})

    return [
      m.score ?? '',
      winMap.get(m.id) ?? '',
      escapeCsv(c.title),
      escapeCsv(c.naics_code),
      escapeCsv(c.psc_code),
      escapeCsv(c.state),
      escapeCsv(c.set_aside),
      fmtDate(c.posted_date),
      fmtDate(c.deadline),
      fmtDate(m.created_at),
      escapeCsv(c.url),
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="plexovia-matches-${days}d-${today}.csv"`,
    },
  })
}
