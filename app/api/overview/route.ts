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

  // Get period from query, default to 7
  const { searchParams } = new URL(request.url)
  const period = parseInt(searchParams.get('period') || '7', 10)
  
  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(now.getDate() - period)
  
  const previousPeriodStart = new Date(periodStart)
  previousPeriodStart.setDate(periodStart.getDate() - period)

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const cutoffISO = ninetyDaysAgo.toISOString().split('T')[0]
  const todayISO = new Date().toISOString().split('T')[0]

  // Fetch current period matches
  const { data: matchesCurrent } = await supabase
    .from('matches')
    .select('score, created_at, contracts(value_min, value_max, set_aside, title, agency, id, deadline, url, naics_code)')
    .eq('user_id', session.user.id)
    .gte('created_at', periodStart.toISOString())
    .or(`posted_date.gte.${cutoffISO},posted_date.is.null`, { referencedTable: 'contracts' })
    .or(`deadline.gte.${todayISO},deadline.is.null`, { referencedTable: 'contracts' })

  // Fetch previous period matches for comparison
  const { data: matchesPrevious } = await supabase
    .from('matches')
    .select('score')
    .eq('user_id', session.user.id)
    .gte('created_at', previousPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())

  const currentCount = matchesCurrent?.length || 0
  const previousCount = matchesPrevious?.length || 0
  
  let weekOverWeekChange = 0
  if (previousCount > 0) {
    weekOverWeekChange = ((currentCount - previousCount) / previousCount) * 100
  } else if (currentCount > 0) {
    weekOverWeekChange = 100 // 100% increase if previous was 0 and current > 0
  }

  let avgScore = 0
  let totalValue = 0
  const topMatches: any[] = []
  const setAsideBreakdown: Record<string, number> = {}

  if (matchesCurrent && matchesCurrent.length > 0) {
    const scores = matchesCurrent.map(m => m.score)
    avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    matchesCurrent.forEach(m => {
      const c: any = Array.isArray(m.contracts) ? (m.contracts[0] || {}) : (m.contracts || {})
      
      // Aggregate total value (use value_max as the representative contract value)
      const val = c.value_max || c.value_min
      if (val && !isNaN(Number(val))) {
        totalValue += Number(val)
      }

      // Aggregate set asides
      const sa = c.set_aside || 'None'
      setAsideBreakdown[sa] = (setAsideBreakdown[sa] || 0) + 1
      
      // Collect all matches, sort by score descending, take top 5
      topMatches.push({
        id: c.id || `m-${m.score}`,
        title: c.title || 'Unknown Contract',
        agency: c.agency || 'Unknown Agency',
        score: m.score,
        deadline: c.deadline || null,
        url: c.url || null,
        naics_code: c.naics_code || null,
        matched_at: m.created_at || null,
      })
    })
    topMatches.sort((a, b) => b.score - a.score)
    if (topMatches.length > 5) topMatches.length = 5
  }

  return NextResponse.json({
    matchesCount: currentCount,
    percentChange: Math.round(weekOverWeekChange),
    avgScore: Math.round(avgScore),
    totalValue,
    topMatches,
    setAsideBreakdown
  })
}
