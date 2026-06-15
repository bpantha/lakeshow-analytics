import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.1-70b-versatile'

export async function generatePlayerInsight(playerName: string, stats: Record<string, number>, recentTrend: string): Promise<string> {
  const prompt = `You are an NBA analytics assistant for the LA Lakers coaching staff. Analyze this player and provide a concise 2-3 sentence insight.

Player: ${playerName}
Current Stats: ${JSON.stringify(stats, null, 2)}
Recent Trend: ${recentTrend}

Focus on actionable observations — development opportunities, concerning patterns, or standout performance. Be specific and data-driven. Do not use generic phrases.`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.4,
  })

  return completion.choices[0]?.message?.content ?? ''
}

export async function generateScoutingInsight(opponentName: string, teamStats: Record<string, number>, tendencies: string): Promise<string> {
  const prompt = `You are an NBA scouting analyst for the LA Lakers. Generate a concise opponent scouting summary (3-4 sentences) for the coaching staff.

Opponent: ${opponentName}
Team Stats: ${JSON.stringify(teamStats, null, 2)}
Observed Tendencies: ${tendencies}

Focus on exploitable weaknesses, key threats to neutralize, and specific game-plan recommendations. Be direct and tactical.`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.3,
  })

  return completion.choices[0]?.message?.content ?? ''
}

export async function generateNightlyReport(data: {
  date: string
  teamRecord: string
  upcomingOpponent?: string
  playerHighlights: Array<{ name: string; statLine: string; trend: string }>
  injuryUpdates: string
}): Promise<{ summary: string; insights: string[] }> {
  const prompt = `You are the head analytics AI for the LA Lakers coaching staff. Generate a nightly report for ${data.date}.

Team Record: ${data.teamRecord}
Upcoming Opponent: ${data.upcomingOpponent ?? 'None scheduled'}
Injury Updates: ${data.injuryUpdates}

Player Highlights:
${data.playerHighlights.map(p => `- ${p.name}: ${p.statLine} (Trend: ${p.trend})`).join('\n')}

Return a JSON object with:
1. "summary": A 2-3 sentence overall team summary
2. "insights": An array of 3-5 specific actionable insights (each 1 sentence)

JSON only, no markdown.`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  try {
    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}')
    return {
      summary: parsed.summary ?? '',
      insights: parsed.insights ?? [],
    }
  } catch {
    return { summary: '', insights: [] }
  }
}

export async function generateGameAnalysis(gameData: {
  gameId: string
  homeTeam: { city: string; abbreviation: string; score: number }
  awayTeam: { city: string; abbreviation: string; score: number }
  topPerformers: Array<{ name: string; team: string; pts: number; reb: number; ast: number; plusMinus: number }>
  isPlayoff: boolean
  date: string
}): Promise<string> {
  const isHome = gameData.homeTeam.abbreviation === 'LAL'
  const lakersScore = isHome ? gameData.homeTeam.score : gameData.awayTeam.score
  const oppAbbr = isHome ? gameData.awayTeam.abbreviation : gameData.homeTeam.abbreviation
  const oppScore = isHome ? gameData.awayTeam.score : gameData.homeTeam.score
  const won = lakersScore > oppScore

  const prompt = `You are an NBA analytics assistant for the LA Lakers coaching staff. Write a post-game analysis (4-5 sentences) for a ${gameData.isPlayoff ? 'playoff' : 'regular season'} game on ${gameData.date}.

Result: Lakers ${won ? 'defeated' : 'lost to'} ${oppAbbr} ${lakersScore}-${oppScore}

Top Performers:
${gameData.topPerformers.map(p => `- ${p.name} (${p.team}): ${p.pts} PTS, ${p.reb} REB, ${p.ast} AST, ${p.plusMinus > 0 ? '+' : ''}${p.plusMinus} +/-`).join('\n')}

Be tactical and specific. Focus on what drove the outcome, key matchup results, and one concrete thing to build on or address. Coaching-staff tone, not broadcast commentary.`

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 350,
    temperature: 0.4,
  })

  return completion.choices[0]?.message?.content ?? ''
}

export async function flagStatTrends(playerName: string, lastFiveGames: number[], statName: string): Promise<{ flagged: boolean; type?: string; message?: string }> {
  if (lastFiveGames.length < 3) return { flagged: false }

  const avg = lastFiveGames.reduce((a, b) => a + b, 0) / lastFiveGames.length
  const recent = lastFiveGames.slice(-3)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const pctChange = ((recentAvg - avg) / avg) * 100

  if (Math.abs(pctChange) < 20) return { flagged: false }

  const type = pctChange > 0 ? 'hot_streak' : 'slump'
  const direction = pctChange > 0 ? 'up' : 'down'

  return {
    flagged: true,
    type,
    message: `${playerName}'s ${statName} is trending ${direction} ${Math.abs(pctChange).toFixed(0)}% over the last 3 games (${recentAvg.toFixed(1)} vs ${avg.toFixed(1)} season avg)`,
  }
}
