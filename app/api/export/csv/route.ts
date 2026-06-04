import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse days parameter (1–90, default 30) ──────────────────────────
    const { searchParams } = new URL(request.url)
    const daysParam = parseInt(searchParams.get('days') || '30', 10)
    const days = Math.min(90, Math.max(1, isNaN(daysParam) ? 30 : daysParam))

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffISO = cutoffDate.toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todayISO = new Date().toISOString().split('T')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('matches')
      .select(
        'score, match_reasons, created_at, ' +
        'contracts!inner(title, state, naics_code, psc_code, ' +
        'set_aside, deadline, posted_date, url)'
      )
      .eq('user_id', session.user.id)
      .gte('created_at', cutoffDate.toISOString())
      .gte('posted_date', cutoffISO, { referencedTable: 'contracts' })
      .or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })
      .order('score', { ascending: false })

    if (error) {
      console.error('[/api/export/csv] Supabase error:', error)
      return NextResponse.json({ error: 'Database Error' }, { status: 500 })
    }

    const matches = data || []

    // ── CSV column order ────────────────────────────────────────────
    const headers = [
      'Score',
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
  } catch (err) {
    console.error('[/api/export/csv] Unhandled error:', err)
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 })
  }
}
