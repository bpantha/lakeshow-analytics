// ESPN unofficial API — free, no key required, works server-side
// Roster: site.api.espn.com  |  Player stats: sports.core.api.espn.com
// Season convention: 2026 = 2025-26 season (end year)

const ESPN_TEAM_ID = 13 // Lakers ESPN ID
const SEASON = 2026     // 2025-26 season end year

const ESPN_TEAM_NAMES: Record<number, { name: string; abbr: string }> = {
  1:  { name: 'Hawks',         abbr: 'ATL' },
  2:  { name: 'Celtics',       abbr: 'BOS' },
  3:  { name: 'Pelicans',      abbr: 'NOP' },
  4:  { name: 'Bulls',         abbr: 'CHI' },
  5:  { name: 'Cavaliers',     abbr: 'CLE' },
  6:  { name: 'Mavericks',     abbr: 'DAL' },
  7:  { name: 'Nuggets',       abbr: 'DEN' },
  8:  { name: 'Pistons',       abbr: 'DET' },
  9:  { name: 'Warriors',      abbr: 'GSW' },
  10: { name: 'Rockets',       abbr: 'HOU' },
  11: { name: 'Pacers',        abbr: 'IND' },
  12: { name: 'Clippers',      abbr: 'LAC' },
  13: { name: 'Lakers',        abbr: 'LAL' },
  14: { name: 'Heat',          abbr: 'MIA' },
  15: { name: 'Bucks',         abbr: 'MIL' },
  16: { name: 'Timberwolves',  abbr: 'MIN' },
  17: { name: 'Nets',          abbr: 'BKN' },
  18: { name: 'Knicks',        abbr: 'NYK' },
  19: { name: 'Magic',         abbr: 'ORL' },
  20: { name: '76ers',         abbr: 'PHI' },
  21: { name: 'Suns',          abbr: 'PHX' },
  22: { name: 'Trail Blazers', abbr: 'POR' },
  23: { name: 'Kings',         abbr: 'SAC' },
  24: { name: 'Spurs',         abbr: 'SAS' },
  25: { name: 'Thunder',       abbr: 'OKC' },
  26: { name: 'Jazz',          abbr: 'UTA' },
  27: { name: 'Wizards',       abbr: 'WSH' },
  28: { name: 'Raptors',       abbr: 'TOR' },
  29: { name: 'Grizzlies',     abbr: 'MEM' },
  30: { name: 'Hornets',       abbr: 'CHA' },
}

// ESPN datetimes are UTC; NBA games on the West Coast play at night so the UTC date
// is often one day ahead of the actual local game date. Convert to Pacific time.
function toLocalDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  } catch {
    return isoString.split('T')[0]
  }
}

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
  efg_pct: number  // 0–1 decimal — (FGM + 0.5×3PM) / FGA
  ts_pct: number   // 0–1 decimal — pts / (2 × (FGA + 0.44×FTA))
  pf: number
  min: number
  plus_minus: number
  stocks: number   // steals + blocks per game
  at_ratio: number // assists / turnovers
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
    const stl = pickStat(cats, 'avgSteals')
    const blk = pickStat(cats, 'avgBlocks')
    const tov = pickStat(cats, 'avgTurnovers')
    const fgPct = pickStat(cats, 'fieldGoalPct') / 100
    const fg3Pct = pickStat(cats, 'threePointFieldGoalPct') / 100
    const ftPct = pickStat(cats, 'freeThrowPct') / 100
    const gp = pickStat(cats, 'gamesPlayed')
    const fga = pickStat(cats, 'avgFieldGoalsAttempted')
    const fgm = pickStat(cats, 'avgFieldGoalsMade')
    const fg3m = pickStat(cats, 'avgThreePointFieldGoalsMade')
    const fta = pickStat(cats, 'avgFreeThrowsAttempted')

    // TS% = PTS / (2 × (FGA + 0.44 × FTA))
    const tsPct = fga + fta > 0 ? pts / (2 * (fga + 0.44 * fta)) : 0
    // eFG% = (FGM + 0.5 × 3PM) / FGA
    const efgPct = fga > 0 ? (fgm + 0.5 * fg3m) / fga : 0

    return {
      playerId: espnId,
      gamesPlayed: Math.round(gp),
      pts,
      reb,
      ast,
      stl,
      blk,
      turnover: tov,
      oreb: pickStat(cats, 'avgOffensiveRebounds'),
      dreb: pickStat(cats, 'avgDefensiveRebounds'),
      fg_pct: fgPct,
      fg3_pct: fg3Pct,
      ft_pct: ftPct,
      efg_pct: efgPct,
      ts_pct: tsPct,
      pf: pickStat(cats, 'avgFouls'),
      min: pickStat(cats, 'avgMinutes'),
      plus_minus: pickStat(cats, 'plusMinus'),
      stocks: stl + blk,
      at_ratio: tov > 0 ? ast / tov : 0,
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
  offRating: number
  defRating: number
  netRating: number
  trueShootingPct: number  // 0–100 scale (e.g. 60.9)
  turnoverRatio: number    // per 100 possessions
  stocksPerGame: number
}

export interface ESPNLeagueTeamStats {
  teamId: number
  teamName: string
  abbr: string
  offRating: number
  defRating: number
  netRating: number
  trueShootingPct: number
  turnoverRatio: number
  netRank: number
  ortgRank: number
  drtgRank: number
  tsRank: number
  tovRank: number
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
      date: e.date ? toLocalDate(e.date) : '',
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

// Sum opponent points from regular-season schedule — used to compute DRtg
async function getTeamOpponentPoints(teamId: number): Promise<number> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/schedule?season=${SEASON}&seasontype=2`
  const data = await espnFetch<ScheduleResponse>(url)
  const tidStr = String(teamId)
  return (data.events ?? []).reduce((sum, e) => {
    const comp = e.competitions[0]
    if (!comp || !comp.status.type.completed) return sum
    const opp = comp.competitors.find(c => c.team.id !== tidStr)
    return opp ? sum + parseScore(opp.score) : sum
  }, 0)
}

export async function getTeamStats(): Promise<ESPNTeamStats> {
  try {
    const [statsData, oppPts] = await Promise.all([
      espnFetch<CoreStatsResponse>(
        `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${SEASON}/types/2/teams/${ESPN_TEAM_ID}/statistics`
      ),
      getTeamOpponentPoints(ESPN_TEAM_ID),
    ])
    const cats = statsData.splits?.categories ?? []
    const points = pickStat(cats, 'points')
    const possessions = pickStat(cats, 'possessions')
    const offRating = possessions > 0 ? (points / possessions) * 100 : 0
    const defRating = possessions > 0 ? (oppPts / possessions) * 100 : 0
    return {
      offRating,
      defRating,
      netRating: offRating - defRating,
      trueShootingPct: pickStat(cats, 'trueShootingPct'),
      turnoverRatio: pickStat(cats, 'turnoverRatio'),
      stocksPerGame: pickStat(cats, 'avgSteals') + pickStat(cats, 'avgBlocks'),
    }
  } catch {
    return { offRating: 0, defRating: 0, netRating: 0, trueShootingPct: 0, turnoverRatio: 0, stocksPerGame: 0 }
  }
}

export async function getLeagueStandings(): Promise<ESPNLeagueTeamStats[]> {
  const ALL_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]

  type RawRow = {
    teamId: number; teamName: string; abbr: string
    offRating: number; defRating: number; netRating: number
    trueShootingPct: number; turnoverRatio: number
  }

  const results = await Promise.allSettled(
    ALL_IDS.map(async (tid): Promise<RawRow> => {
      const teamInfo = ESPN_TEAM_NAMES[tid] ?? { name: `Team ${tid}`, abbr: String(tid) }
      const [statsData, oppPts] = await Promise.all([
        espnFetch<CoreStatsResponse>(
          `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${SEASON}/types/2/teams/${tid}/statistics`
        ),
        getTeamOpponentPoints(tid),
      ])
      const cats = statsData.splits?.categories ?? []
      const points = pickStat(cats, 'points')
      const possessions = pickStat(cats, 'possessions')
      const offRating = possessions > 0 ? (points / possessions) * 100 : 0
      const defRating = possessions > 0 ? (oppPts / possessions) * 100 : 0
      return {
        teamId: tid,
        teamName: teamInfo.name,
        abbr: teamInfo.abbr,
        offRating,
        defRating,
        netRating: offRating - defRating,
        trueShootingPct: pickStat(cats, 'trueShootingPct'),
        turnoverRatio: pickStat(cats, 'turnoverRatio'),
      }
    })
  )

  const teams = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<RawRow>).value)
    .sort((a, b) => b.netRating - a.netRating)

  const rank = <K extends keyof RawRow>(arr: RawRow[], key: K, asc: boolean) =>
    new Map(
      [...arr].sort((a, b) => asc
        ? (a[key] as number) - (b[key] as number)
        : (b[key] as number) - (a[key] as number)
      ).map((t, i) => [t.teamId, i + 1])
    )

  const ortgRankMap = rank(teams, 'offRating', false)
  const drtgRankMap = rank(teams, 'defRating', true)   // lower DRtg = better defense
  const tsRankMap   = rank(teams, 'trueShootingPct', false)
  const tovRankMap  = rank(teams, 'turnoverRatio', true) // lower TOV% = better

  return teams.map((t, i) => ({
    ...t,
    netRank:  i + 1,
    ortgRank: ortgRankMap.get(t.teamId) ?? 0,
    drtgRank: drtgRankMap.get(t.teamId) ?? 0,
    tsRank:   tsRankMap.get(t.teamId) ?? 0,
    tovRank:  tovRankMap.get(t.teamId) ?? 0,
  }))
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

export interface ESPNBoxScorePlayer {
  id: string
  name: string
  jersey: string
  position: string
  starter: boolean
  dnp: boolean
  min: string
  pts: number
  fg: string
  fg3: string
  ft: string
  reb: number
  oreb: number
  dreb: number
  ast: number
  to: number
  stl: number
  blk: number
  pf: number
  plusMinus: number
}

export interface ESPNBoxScoreTeam {
  id: string
  abbreviation: string
  city: string
  score: number
  players: ESPNBoxScorePlayer[]
}

export interface ESPNGameSummary {
  gameId: string
  date: string
  homeTeam: ESPNBoxScoreTeam
  awayTeam: ESPNBoxScoreTeam
  isPlayoff: boolean
  status: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBoxPlayers(teamEntry: any): ESPNBoxScorePlayer[] {
  const players: ESPNBoxScorePlayer[] = []
  const statGroups: any[] = teamEntry.statistics ?? [] // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const group of statGroups) {
    const athletes: any[] = group.athletes ?? [] // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const a of athletes) {
      const stats: string[] = a.stats ?? []
      const isDnp = stats.length < 2 || stats[0] === 'DNP' || stats[1] === '--'
      players.push({
        id: a.athlete?.id ?? '',
        name: a.athlete?.displayName ?? '',
        jersey: a.athlete?.jersey ?? '',
        position: a.athlete?.position?.abbreviation ?? '',
        starter: a.starter ?? false,
        dnp: isDnp,
        min: isDnp ? 'DNP' : (stats[0] ?? '0'),
        pts: isDnp ? 0 : (parseInt(stats[1]) || 0),
        fg: isDnp ? '' : (stats[2] ?? ''),
        fg3: isDnp ? '' : (stats[3] ?? ''),
        ft: isDnp ? '' : (stats[4] ?? ''),
        reb: isDnp ? 0 : (parseInt(stats[5]) || 0),
        ast: isDnp ? 0 : (parseInt(stats[6]) || 0),
        to: isDnp ? 0 : (parseInt(stats[7]) || 0),
        stl: isDnp ? 0 : (parseInt(stats[8]) || 0),
        blk: isDnp ? 0 : (parseInt(stats[9]) || 0),
        oreb: isDnp ? 0 : (parseInt(stats[10]) || 0),
        dreb: isDnp ? 0 : (parseInt(stats[11]) || 0),
        pf: isDnp ? 0 : (parseInt(stats[12]) || 0),
        plusMinus: isDnp ? 0 : (parseInt(stats[13]) || 0),
      })
    }
  }
  return players
}

export async function getGameSummary(eventId: string): Promise<ESPNGameSummary | null> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await espnFetch<any>(url)

    const competition = data.header?.competitions?.[0]
    if (!competition) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeComp = competition.competitors?.find((c: any) => c.homeAway === 'home')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayComp = competition.competitors?.find((c: any) => c.homeAway === 'away')

    const playerTeams: any[] = data.boxscore?.players ?? [] // eslint-disable-line @typescript-eslint/no-explicit-any
    // Use String() comparison — ESPN may return id as number in one field and string in another
    const homePlayerTeam = playerTeams.find((t: any) => String(t.team?.id) === String(homeComp?.team?.id)) // eslint-disable-line @typescript-eslint/no-explicit-any
    const awayPlayerTeam = playerTeams.find((t: any) => String(t.team?.id) === String(awayComp?.team?.id)) // eslint-disable-line @typescript-eslint/no-explicit-any

    return {
      gameId: eventId,
      date: competition.date ? toLocalDate(competition.date) : '',
      isPlayoff: (data.header?.season?.type ?? 2) === 3,
      status: competition.status?.type?.description ?? 'Final',
      homeTeam: {
        id: homeComp?.team?.id ?? '',
        abbreviation: homeComp?.team?.abbreviation ?? '',
        city: homeComp?.team?.location ?? '',
        score: parseScore(homeComp?.score),
        players: homePlayerTeam ? parseBoxPlayers(homePlayerTeam) : [],
      },
      awayTeam: {
        id: awayComp?.team?.id ?? '',
        abbreviation: awayComp?.team?.abbreviation ?? '',
        city: awayComp?.team?.location ?? '',
        score: parseScore(awayComp?.score),
        players: awayPlayerTeam ? parseBoxPlayers(awayPlayerTeam) : [],
      },
    }
  } catch {
    return null
  }
}

export { ESPN_TEAM_ID, SEASON as ESPN_SEASON }
