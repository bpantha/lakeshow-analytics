// balldontlie.io API — real NBA data, works server-side
// Season convention: 2025 = 2025-26 season (start year)

const BASE = 'https://api.balldontlie.io/v1'
const LAKERS_TEAM_ID = 14 // balldontlie team ID for Lakers
const CURRENT_SEASON = 2025 // 2025-26 season

function headers() {
  return {
    Authorization: process.env.BALLDONTLIE_API_KEY ?? '',
  }
}

async function bdlFetch<T>(path: string, params: Record<string, string | number | string[] | number[]> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach(item => url.searchParams.append(`${k}[]`, String(item)))
    } else {
      url.searchParams.set(k, String(v))
    }
  })
  const res = await fetch(url.toString(), {
    headers: headers(),
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`balldontlie error: ${res.status} ${await res.text()}`)
  return res.json()
}

export interface BDLPlayer {
  id: number
  first_name: string
  last_name: string
  position: string
  height: string
  weight: string
  jersey_number: string
  college: string
  country: string
  draft_year: number | null
  draft_round: number | null
  draft_number: number | null
  team: BDLTeam
}

export interface BDLTeam {
  id: number
  conference: string
  division: string
  city: string
  name: string
  full_name: string
  abbreviation: string
}

export interface BDLSeasonAverage {
  player_id: number
  season: number
  games_played: number
  min: string
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  turnover: number
  oreb: number
  dreb: number
  fg_pct: number
  fg3_pct: number
  ft_pct: number
  pf: number
}

export interface BDLGame {
  id: number
  date: string
  season: number
  status: string
  home_team: BDLTeam
  home_team_score: number
  visitor_team: BDLTeam
  visitor_team_score: number
  postseason: boolean
}

interface PagedResponse<T> {
  data: T[]
  meta: { next_cursor?: number; per_page: number }
}

// Fetch all pages of a paginated endpoint
async function fetchAllPages<T>(path: string, params: Record<string, string | number | string[] | number[]> = {}): Promise<T[]> {
  const results: T[] = []
  let cursor: number | undefined

  do {
    const p = cursor ? { ...params, cursor, per_page: 100 } : { ...params, per_page: 100 }
    const res = await bdlFetch<PagedResponse<T>>(path, p)
    results.push(...res.data)
    cursor = res.meta.next_cursor
  } while (cursor)

  return results
}

export async function getLakersRoster(): Promise<BDLPlayer[]> {
  return fetchAllPages<BDLPlayer>('/players/active', {
    team_ids: [LAKERS_TEAM_ID],
  })
}

export async function getPlayerSeasonAverages(playerIds: number[]): Promise<BDLSeasonAverage[]> {
  if (playerIds.length === 0) return []
  const res = await bdlFetch<{ data: BDLSeasonAverage[] }>('/season_averages', {
    season: CURRENT_SEASON,
    player_ids: playerIds,
  })
  return res.data
}

export async function getSinglePlayerAverages(playerId: number): Promise<BDLSeasonAverage | null> {
  const avgs = await getPlayerSeasonAverages([playerId])
  return avgs[0] ?? null
}

export async function getLakersGames(): Promise<BDLGame[]> {
  return fetchAllPages<BDLGame>('/games', {
    seasons: [CURRENT_SEASON],
    team_ids: [LAKERS_TEAM_ID],
    per_page: 100,
  })
}

export async function getUpcomingGames(limit = 5): Promise<BDLGame[]> {
  const today = new Date().toISOString().split('T')[0]
  const games = await fetchAllPages<BDLGame>('/games', {
    seasons: [CURRENT_SEASON],
    team_ids: [LAKERS_TEAM_ID],
    start_date: today,
    per_page: 25,
  })
  return games
    .filter(g => g.status !== 'Final')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit)
}

export async function getTeamById(teamId: number): Promise<BDLTeam | null> {
  try {
    const res = await bdlFetch<{ data: BDLTeam }>(`/teams/${teamId}`)
    return res.data
  } catch {
    return null
  }
}

export async function getAllTeams(): Promise<BDLTeam[]> {
  const res = await bdlFetch<{ data: BDLTeam[] }>('/teams')
  return res.data
}

export async function searchPlayers(query: string): Promise<BDLPlayer[]> {
  const res = await bdlFetch<PagedResponse<BDLPlayer>>('/players', {
    search: query,
    per_page: 25,
  })
  return res.data
}

export async function getPlayerById(id: number): Promise<BDLPlayer | null> {
  try {
    const res = await bdlFetch<{ data: BDLPlayer }>(`/players/${id}`)
    return res.data
  } catch {
    return null
  }
}

// Derive team record from game results
export function getTeamRecord(games: BDLGame[]): { wins: number; losses: number } {
  let wins = 0
  let losses = 0
  for (const g of games) {
    if (g.status !== 'Final') continue
    const lakersHome = g.home_team.id === LAKERS_TEAM_ID
    const lakersScore = lakersHome ? g.home_team_score : g.visitor_team_score
    const oppScore = lakersHome ? g.visitor_team_score : g.home_team_score
    if (lakersScore > oppScore) wins++
    else losses++
  }
  return { wins, losses }
}

export { LAKERS_TEAM_ID, CURRENT_SEASON }
