import { createClient } from '@/lib/supabase/server'
import { getLeagueDashPlayerStats, getLakersSchedule, LAKERS_TEAM_ID } from '@/lib/nba/api'
import { generateNightlyReport, flagStatTrends } from '@/lib/groq/insights'
import { NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['coach', 'analyst'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    let lakersPlayers: Record<string, unknown>[] = []
    let schedule: Record<string, unknown>[] = []

    try { lakersPlayers = (await getLeagueDashPlayerStats()).filter((p: Record<string, unknown>) => p.TEAM_ID === LAKERS_TEAM_ID) } catch {}
    try { schedule = await getLakersSchedule() } catch {}

    // Team record
    const played = schedule.filter(g => g.WL)
    const wins = played.filter(g => g.WL === 'W').length
    const losses = played.filter(g => g.WL === 'L').length

    // Build player highlights
    const playerHighlights = lakersPlayers.slice(0, 8).map(p => ({
      name: p.PLAYER_NAME as string,
      statLine: `${Number(p.PTS).toFixed(1)} PTS / ${Number(p.REB).toFixed(1)} REB / ${Number(p.AST).toFixed(1)} AST`,
      trend: 'stable' as const,
    }))

    // AI report generation
    const { summary, insights } = await generateNightlyReport({
      date: format(new Date(), 'MMMM d, yyyy'),
      teamRecord: `${wins}-${losses}`,
      playerHighlights,
      injuryUpdates: 'No current injury updates available via API.',
    })

    // Stat trend flagging
    const flaggedHighlights = await Promise.all(
      lakersPlayers.slice(0, 5).map(async p => {
        const flag = await flagStatTrends(
          p.PLAYER_NAME as string,
          [Number(p.PTS)],
          'scoring'
        )
        return {
          player_name: p.PLAYER_NAME as string,
          headline: flag.message ?? `${Number(p.PTS).toFixed(1)} PPG this season`,
          stat_line: `${Number(p.PTS).toFixed(1)} PTS / ${Number(p.REB).toFixed(1)} REB / ${Number(p.AST).toFixed(1)} AST`,
          trend: 'stable' as const,
          flag_type: flag.type,
        }
      })
    )

    const { data: report } = await supabase
      .from('nightly_reports')
      .insert({
        report_date: format(new Date(), 'yyyy-MM-dd'),
        generated_by: user.id,
        team_summary: summary,
        player_highlights: flaggedHighlights,
        ai_insights: insights,
        injury_updates: 'No current injury updates available.',
      })
      .select()
      .single()

    return NextResponse.json({ success: true, report })
  } catch (err) {
    console.error('Report generation error:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
