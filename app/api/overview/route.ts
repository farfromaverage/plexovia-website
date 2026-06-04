import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get period from query, default to 7
    const { searchParams } = new URL(request.url)
    const period = Math.min(90, Math.max(1, parseInt(searchParams.get('period') || '7', 10) || 7))
    
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
      .select('score, created_at, contracts!inner(value_min, value_max, set_aside, title, agency, id, deadline, url, naics_code)')
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
    const topMatches: Array<{ id: string; title: string; agency: string; score: number; deadline: string | null; url: string | null; naics_code: string | null; matched_at: string | null }> = []
    const setAsideBreakdown: Record<string, number> = {}

    if (matchesCurrent && matchesCurrent.length > 0) {
      const scores = matchesCurrent.map(m => m.score)
      avgScore = scores.reduce((a, b) => a + b, 0) / scores.length

      matchesCurrent.forEach(m => {
        const contract = Array.isArray(m.contracts) ? (m.contracts[0] || {}) : (m.contracts || {})
        const c = contract as {
          id?: string; title?: string; agency?: string; deadline?: string | null;
          url?: string | null; naics_code?: string | null; value_min?: unknown;
          value_max?: unknown; set_aside?: string;
        }
        
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
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[/api/overview] Unhandled error:', err)
    return NextResponse.json({
      error: 'Failed to load overview',
      matchesCount: 0, percentChange: 0, avgScore: 0, totalValue: 0,
      topMatches: [], setAsideBreakdown: {}
    }, { status: 500 })
  }
}
