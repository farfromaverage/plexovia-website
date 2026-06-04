import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ExportQueryBuilder extends PromiseLike<{ data: ExportMatchRow[] | null; error: { message: string } | null }> {
  eq(col: string, val: unknown): ExportQueryBuilder
  gte(col: string, val: unknown): ExportQueryBuilder
  or(filters: string, opts?: { referencedTable?: string }): ExportQueryBuilder
  order(col: string, opts?: { ascending?: boolean }): ExportQueryBuilder
  limit(n: number): ExportQueryBuilder
}

interface ExportMatchRow {
  score: number
  match_reasons: string[]
  created_at: string
  contracts: Array<{
    title: string | null
    agency: string | null
    state: string | null
    naics_code: string | null
    psc_code: string | null
    set_aside: string | null
    deadline: string | null
    posted_date: string | null
    url: string | null
  }>
}

const EXPORT_LIMIT = 5000

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

    const todayISO = new Date().toISOString().split('T')[0]
    const { data, error } = await (supabase
      .from('matches')
      .select(
        'score, match_reasons, created_at, ' +
        'contracts!inner(title, agency, state, naics_code, psc_code, ' +
        'set_aside, deadline, posted_date, url)'
      ) as unknown as ExportQueryBuilder)
      .eq('user_id', session.user.id)
      .gte('created_at', cutoffDate.toISOString())
      .or(`posted_date.gte.${cutoffISO},posted_date.is.null`, { referencedTable: 'contracts' })
      .or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })
      .order('score', { ascending: false })
      .limit(EXPORT_LIMIT)

    if (error) {
      console.error('[/api/export/csv] Supabase error:', error)
      return NextResponse.json({ error: 'Database Error' }, { status: 500 })
    }

    const matches = data || []

    // ── CSV column order ────────────────────────────────────────────
    const headers = [
      'Score',
      'Title',
      'Agency',
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

    const rows = matches.map((m: ExportMatchRow) => {
      const c = Array.isArray(m.contracts)
        ? (m.contracts[0] || {})
        : (m.contracts || {})

      return [
        m.score ?? '',
        escapeCsv(c.title),
        escapeCsv(c.agency),
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

    const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n')

    const today = new Date().toISOString().split('T')[0]

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="plexovia-matches-${days}d-${today}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[/api/export/csv] Unhandled error:', err)
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 })
  }
}
