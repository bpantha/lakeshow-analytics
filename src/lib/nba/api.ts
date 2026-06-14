import {
  CURRENT_SEASON,
  LAKERS_ROSTER,
  LAKERS_PLAYER_STATS,
  LAKERS_SCHEDULE_2025_26,
} from './lakers-data'

const NBA_BASE = 'https://stats.nba.com/stats'

const HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Host': 'stats.nba.com',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

async function nbaFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${NBA_BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: HEADERS,
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`NBA API error: ${res.status}`)
  const data = await res.json()
  const { headers: cols, rowSet } = data.resultSets[0]
  return rowSet.map((row: unknown[]) =>
    Object.fromEntries(cols.map((col: string, i: number) => [col, row[i]]))
  )
}

export async function getLakersRoster(season = CURRENT_SEASON) {
  try {
    return await nbaFetch('commonteamroster', { TeamID: '1610612747', Season: season })
  } catch {
    return LAKERS_ROSTER
  }
}

export async function getPlayerStats(playerId: number, season = CURRENT_SEASON) {
  try {
    const rows = await nbaFetch('playerdashboardbyyearoveryear', {
      PlayerID: String(playerId),
      Season: season,
      SeasonType: 'Regular Season',
      MeasureType: 'Base',
      PerMode: 'PerGame',
      PlusMinus: 'N',
      PaceAdjust: 'N',
      Rank: 'N',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      GameSegment: '',
      Period: '0',
      ShotClockRange: '',
      LastNGames: '0',
    })
    return rows[0] ?? LAKERS_PLAYER_STATS[playerId] ?? null
  } catch {
    return LAKERS_PLAYER_STATS[playerId] ?? null
  }
}

export async function getTeamStats(teamId: number, season = CURRENT_SEASON) {
  try {
    const rows = await nbaFetch('teamdashboardbygeneralsplits', {
      TeamID: String(teamId),
      Season: season,
      SeasonType: 'Regular Season',
      MeasureType: 'Base',
      PerMode: 'PerGame',
      PlusMinus: 'N',
      PaceAdjust: 'N',
      Rank: 'N',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      GameSegment: '',
      Period: '0',
      LastNGames: '0',
    })
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getLeagueDashPlayerStats(season = CURRENT_SEASON) {
  try {
    return await nbaFetch('leaguedashplayerstats', {
      Season: season,
      SeasonType: 'Regular Season',
      MeasureType: 'Base',
      PerMode: 'PerGame',
      PlusMinus: 'N',
      PaceAdjust: 'N',
      Rank: 'N',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      GameSegment: '',
      Period: '0',
      ShotClockRange: '',
      LastNGames: '0',
      College: '',
      Conference: '',
      Country: '',
      DraftPick: '',
      DraftYear: '',
      GameScope: '',
      Height: '',
      PlayerExperience: '',
      PlayerPosition: '',
      StarterBench: '',
      TeamID: '0',
      TwoWay: '0',
      Weight: '',
    })
  } catch {
    // Fall back to static Lakers player stats
    return Object.values(LAKERS_PLAYER_STATS)
  }
}

export async function getPlayerShotChart(playerId: number, season = CURRENT_SEASON) {
  try {
    return await nbaFetch('shotchartdetail', {
      PlayerID: String(playerId),
      Season: season,
      SeasonType: 'Regular Season',
      TeamID: '0',
      GameID: '',
      Outcome: '',
      Location: '',
      Month: '0',
      SeasonSegment: '',
      DateFrom: '',
      DateTo: '',
      OpponentTeamID: '0',
      VsConference: '',
      VsDivision: '',
      Position: '',
      RookieYear: '',
      GameSegment: '',
      Period: '0',
      LastNGames: '0',
      ContextMeasure: 'FGA',
      PlayerPosition: '',
      AheadBehind: '',
      ClutchTime: '',
      PointDiff: '',
    })
  } catch {
    return []
  }
}

export async function getLakersSchedule() {
  try {
    const rows = await nbaFetch('leaguegamefinder', {
      PlayerOrTeam: 'T',
      TeamID: '1610612747',
      Season: CURRENT_SEASON,
      SeasonType: 'Regular Season',
      LeagueID: '00',
    })
    // If no games yet (pre-season), return static schedule
    return rows.length > 0 ? rows : LAKERS_SCHEDULE_2025_26
  } catch {
    return LAKERS_SCHEDULE_2025_26
  }
}

export const LAKERS_TEAM_ID = 1610612747

export const NBA_TEAMS: Record<number, { name: string; abbreviation: string; city: string }> = {
  1610612747: { name: 'Lakers', abbreviation: 'LAL', city: 'Los Angeles' },
  1610612738: { name: 'Celtics', abbreviation: 'BOS', city: 'Boston' },
  1610612744: { name: 'Warriors', abbreviation: 'GSW', city: 'Golden State' },
  1610612748: { name: 'Heat', abbreviation: 'MIA', city: 'Miami' },
  1610612749: { name: 'Bucks', abbreviation: 'MIL', city: 'Milwaukee' },
  1610612743: { name: 'Nuggets', abbreviation: 'DEN', city: 'Denver' },
  1610612759: { name: 'Spurs', abbreviation: 'SAS', city: 'San Antonio' },
  1610612760: { name: 'Thunder', abbreviation: 'OKC', city: 'Oklahoma City' },
  1610612756: { name: 'Suns', abbreviation: 'PHX', city: 'Phoenix' },
  1610612758: { name: 'Kings', abbreviation: 'SAC', city: 'Sacramento' },
  1610612757: { name: 'Trail Blazers', abbreviation: 'POR', city: 'Portland' },
  1610612742: { name: 'Mavericks', abbreviation: 'DAL', city: 'Dallas' },
  1610612737: { name: 'Hawks', abbreviation: 'ATL', city: 'Atlanta' },
  1610612741: { name: 'Bulls', abbreviation: 'CHI', city: 'Chicago' },
  1610612739: { name: 'Cavaliers', abbreviation: 'CLE', city: 'Cleveland' },
  1610612765: { name: 'Pistons', abbreviation: 'DET', city: 'Detroit' },
  1610612750: { name: 'Timberwolves', abbreviation: 'MIN', city: 'Minnesota' },
  1610612740: { name: 'Pelicans', abbreviation: 'NOP', city: 'New Orleans' },
  1610612752: { name: 'Knicks', abbreviation: 'NYK', city: 'New York' },
  1610612753: { name: 'Magic', abbreviation: 'ORL', city: 'Orlando' },
  1610612755: { name: '76ers', abbreviation: 'PHI', city: 'Philadelphia' },
  1610612761: { name: 'Raptors', abbreviation: 'TOR', city: 'Toronto' },
  1610612764: { name: 'Wizards', abbreviation: 'WAS', city: 'Washington' },
  1610612762: { name: 'Jazz', abbreviation: 'UTA', city: 'Utah' },
}
