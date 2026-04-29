import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getTeamRole, canWriteData } from '@/lib/team'

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

  const role = await getTeamRole(supabase, session.user.id);
  if (!canWriteData(role)) {
    return new NextResponse('Forbidden: Viewers cannot export data', { status: 403 })
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data, error } = await supabase
    .from('matches')
    .select('score, reason, contracts(*)')
    .eq('user_id', session.user.id)
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('score', { ascending: false })

  if (error) {
    console.error('[/api/export/csv] Supabase error:', error)
    return new NextResponse('Database Error', { status: 500 })
  }

  const matches = data || []
  
  // Build CSV
  const headers = [
    'title', 'agency', 'state', 'naics_code', 'contract_value',
    'set_aside_type', 'closing_date', 'posted_date',
    'score', 'reason', 'source_url'
  ]

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return ''
    const s = String(str).replace(/"/g, '""')
    return `"${s}"`
  }

  const rows = matches.map(m => {
    const c: any = Array.isArray(m.contracts) ? (m.contracts[0] || {}) : (m.contracts || {})
    return [
      escapeCsv(c.title),
      escapeCsv(c.agency),
      escapeCsv(c.state),
      escapeCsv(c.naics_code),
      escapeCsv(c.contract_value),
      escapeCsv(c.set_aside_type),
      escapeCsv(c.closing_date),
      escapeCsv(c.posted_date),
      escapeCsv(m.score),
      escapeCsv(m.reason),
      escapeCsv(c.source_url)
    ].join(',')
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  const today = new Date().toISOString().split('T')[0]
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="plexovia-matches-${today}.csv"`
    }
  })
}
