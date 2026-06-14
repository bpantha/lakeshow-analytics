import { createClient } from '@/lib/supabase/server'
import { generateScoutingInsight } from '@/lib/groq/insights'
import { NBA_TEAMS } from '@/lib/nba/api'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId, offensiveTendencies, defensiveTendencies, offensiveRating, defensiveRating } = await req.json()

  const team = NBA_TEAMS[Number(teamId)]
  const teamName = team ? `${team.city} ${team.name}` : `Team ${teamId}`

  try {
    const summary = await generateScoutingInsight(
      teamName,
      { offensive_rating: Number(offensiveRating), defensive_rating: Number(defensiveRating) },
      `${offensiveTendencies}\n\nDefensively: ${defensiveTendencies}`
    )
    return NextResponse.json({ summary })
  } catch (err) {
    console.error('Scouting insight error:', err)
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 })
  }
}
