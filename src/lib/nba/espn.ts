// ESPN unofficial API — free, no key required, works server-side
// Roster: site.api.espn.com  |  Player stats: sports.core.api.espn.com
// Season convention: 2026 = 2025-26 season (end year)

const ESPN_TEAM_ID = 13 // Lakers ESPN ID
const SEASON = 2026     // 2025-26 season end year

async function espnFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`ESPN error: ${res.status} ${url}`)
  return res.json()
}

export interface ESPNPlayer {
  id: string
  firstName: string
  lastName: string
  fullName: string
  jersey: string
  position: string
  positionAbbr: string
  headshot?: string
  height: string
  weight: string
}

export interface ESPNPlayerStats {
  playerId: string
  gamesPlayed: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  turnover: number
  oreb: number
  dreb: number
  fg_pct: number   // 0–1 decimal
  fg3_pct: number  // 0–1 decimal
  ft_pct: number   // 0–1 decimal
  pf: number
  min: number
  ts_pct: number   // 0–1 decimal
  plus_minus: number
}

interface RosterResponse {
  athletes: Array<{
    id: string
    firstName: string
    lastName: string
    fullName: string
    jersey: string
    position: { abbreviation: string; displayName: string }
    headshot?: { href: string }
    displayHeight: string
    displayWeight: string
  }>
}

export async function getESPNRoster(): Promise<ESPNPlayer[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${ESPN_TEAM_ID}/roster`
  const data = await espnFetch<RosterResponse>(url)
  return (data.athletes ?? []).map(a => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    fullName: a.fullName,
    jersey: a.jersey ?? '',
    position: a.position?.displayName ?? '',
    positionAbbr: a.position?.abbreviation ?? '',
    headshot: a.headshot?.href,
    height: a.displayHeight ?? '',
    weight: a.displayWeight ?? '',
  }))
}

interface CoreStatsCategory {
  name: string
  stats: Array<{ name: string; value: number }>
}

interface CoreStatsResponse {
  splits: { categories: CoreStatsCategory[] }
}

function pickStat(categories: CoreStatsCategory[], statName: string): number {
  for (const cat of categories) {
    const s = cat.stats.find(x => x.name === statName)
    if (s != null) return s.value
  }
  return 0
}

export async function getESPNPlayerStats(espnId: string): Promise<ESPNPlayerStats | null> {
  try {
    const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${SEASON}/types/2/athletes/${espnId}/statistics`
    const data = await espnFetch<CoreStatsResponse>(url)
    const cats = data.splits?.categories ?? []
    if (cats.length === 0) return null

    const pts = pickStat(cats, 'avgPoints')
    const reb = pickStat(cats, 'avgRebounds')
    const ast = pickStat(cats, 'avgAssists')
    const fgPct = pickStat(cats, 'fieldGoalPct') / 100
    const fg3Pct = pickStat(cats, 'threePointFieldGoalPct') / 100
    const ftPct = pickStat(cats, 'freeThrowPct') / 100
    const gp = pickStat(cats, 'gamesPlayed')
    const fta = pickStat(cats, 'avgFreeThrowsAttempted')

    // true shooting %: PTS / (2 * (FGA + 0.44 * FTA))
    const fga = pickStat(cats, 'avgFieldGoalsAttempted')
    const tsPct = fga + fta > 0 ? pts / (2 * (fga + 0.44 * fta)) : 0

    return {
      playerId: espnId,
      gamesPlayed: Math.round(gp),
      pts,
      reb,
      ast,
      stl: pickStat(cats, 'avgSteals'),
      blk: pickStat(cats, 'avgBlocks'),
      turnover: pickStat(cats, 'avgTurnovers'),
      oreb: pickStat(cats, 'avgOffensiveRebounds'),
      dreb: pickStat(cats, 'avgDefensiveRebounds'),
      fg_pct: fgPct,
      fg3_pct: fg3Pct,
      ft_pct: ftPct,
      pf: pickStat(cats, 'avgFouls'),
      min: pickStat(cats, 'avgMinutes'),
      ts_pct: tsPct,
      plus_minus: pickStat(cats, 'plusMinus'),
    }
  } catch {
    return null
  }
}

export async function getESPNRosterStats(
  roster: ESPNPlayer[]
): Promise<Record<string, ESPNPlayerStats>> {
  const results = await Promise.allSettled(
    roster.map(p => getESPNPlayerStats(p.id))
  )
  const map: Record<string, ESPNPlayerStats> = {}
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      map[roster[i].id] = r.value
    }
  })
  return map
}

export interface ESPNGame {
  id: string
  date: string
  homeTeam: { id: string; abbreviation: string; city: string; score: number }
  awayTeam: { id: string; abbreviation: string; city: string; score: number }
  completed: boolean
  status: string
  isPlayoff: boolean
}

export interface ESPNTeamStats {
  pts: number
  reb: number
  ast: number
}

interface ScheduleResponse {
  events: Array<{
    id: string
    date: string
    competitions: Array<{
      status: { type: { completed: boolean; description: string } }
      competitors: Array<{
        homeAway: string
        score: { value?: number; displayValue?: string } | string
        team: { id: string; abbreviation: string; location: string }
      }>
    }>
  }>
}

function parseScore(score: { value?: number; displayValue?: string } | string | undefined): number {
  if (!score) return 0
  if (typeof score === 'object') return score.value ?? 0
  return parseFloat(score) || 0
}

async function fetchScheduleForType(seasonType: number): Promise<ESPNGame[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${ESPN_TEAM_ID}/schedule?season=${SEASON}&seasontype=${seasonType}`
  const data = await espnFetch<ScheduleResponse>(url)
  return (data.events ?? []).map(e => {
    const comp = e.competitions?.[0]
    const home = comp?.competitors?.find(c => c.homeAway === 'home')
    const away = comp?.competitors?.find(c => c.homeAway === 'away')
    return {
      id: e.id,
      date: e.date?.split('T')[0] ?? '',
      homeTeam: {
        id: home?.team.id ?? '',
        abbreviation: home?.team.abbreviation ?? '',
        city: home?.team.location ?? '',
        score: parseScore(home?.score),
      },
      awayTeam: {
        id: away?.team.id ?? '',
        abbreviation: away?.team.abbreviation ?? '',
        city: away?.team.location ?? '',
        score: parseScore(away?.score),
      },
      completed: comp?.status.type.completed ?? false,
      status: comp?.status.type.description ?? '',
      isPlayoff: seasonType === 3,
    }
  })
}

export async function getLakersSchedule(): Promise<ESPNGame[]> {
  const [regular, playoffs] = await Promise.all([
    fetchScheduleForType(2),
    fetchScheduleForType(3).catch(() => []),
  ])
  return [...regular, ...playoffs].sort((a, b) => a.date.localeCompare(b.date))
}

export function getLakersRecord(games: ESPNGame[]): { wins: number; losses: number; playoffWins: number; playoffLosses: number } {
  let wins = 0, losses = 0, playoffWins = 0, playoffLosses = 0
  const lakersId = String(ESPN_TEAM_ID)
  for (const g of games) {
    if (!g.completed) continue
    const lakersHome = g.homeTeam.id === lakersId
    const lakersScore = lakersHome ? g.homeTeam.score : g.awayTeam.score
    const oppScore = lakersHome ? g.awayTeam.score : g.homeTeam.score
    if (g.isPlayoff) {
      if (lakersScore > oppScore) playoffWins++
      else playoffLosses++
    } else {
      if (lakersScore > oppScore) wins++
      else losses++
    }
  }
  return { wins, losses, playoffWins, playoffLosses }
}

interface TeamStatsResponse {
  results: {
    stats: {
      categories: Array<{
        stats: Array<{ name: string; value: number }>
      }>
    }
  }
}

export async function getTeamStats(): Promise<ESPNTeamStats> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${ESPN_TEAM_ID}/statistics?season=${SEASON}&seasontype=2`
    const data = await espnFetch<TeamStatsResponse>(url)
    const cats = data.results?.stats?.categories ?? []
    function pick(name: string) {
      for (const cat of cats) {
        const s = cat.stats.find(x => x.name === name)
        if (s) return s.value
      }
      return 0
    }
    return {
      pts: pick('avgPoints'),
      reb: pick('avgRebounds'),
      ast: pick('avgAssists'),
    }
  } catch {
    return { pts: 0, reb: 0, ast: 0 }
  }
}

export function getUpcomingESPNGames(games: ESPNGame[], limit = 5): ESPNGame[] {
  const today = new Date().toISOString().split('T')[0]
  return games
    .filter(g => !g.completed && g.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
}

export function getRecentESPNGames(games: ESPNGame[], limit = 5): ESPNGame[] {
  return games
    .filter(g => g.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

export { ESPN_TEAM_ID, SEASON as ESPN_SEASON }
