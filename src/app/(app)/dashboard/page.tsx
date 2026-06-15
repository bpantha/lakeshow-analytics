import { createClient } from '@/lib/supabase/server'
import {
  getESPNRoster,
  getESPNRosterStats,
  getLakersSchedule,
  getLakersRecord,
  getUpcomingESPNGames,
  getRecentESPNGames,
  getTeamStats,
  type ESPNPlayerStats,
} from '@/lib/nba/espn'
import { CURRENT_SEASON } from '@/lib/nba/lakers-data'
import StatCard from '@/components/dashboard/StatCard'
import UpcomingGamesESPN from '@/components/dashboard/UpcomingGamesESPN'
import PlayerSnapshotList from '@/components/dashboard/PlayerSnapshotList'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'
import { format } from 'date-fns'

export const revalidate = 3600

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const today = new Date()

  const [roster, schedule, teamStats] = await Promise.all([
    getESPNRoster().catch(() => []),
    getLakersSchedule().catch(() => []),
    getTeamStats(),
  ])
  const statsMap: Record<string, ESPNPlayerStats> = roster.length > 0
    ? await getESPNRosterStats(roster).catch(() => ({} as Record<string, ESPNPlayerStats>))
    : {}

  const { wins, losses, playoffWins, playoffLosses } = getLakersRecord(schedule)
  const upcoming = getUpcomingESPNGames(schedule, 5)
  const recentGames = upcoming.length === 0 ? getRecentESPNGames(schedule, 5) : []

  const { data: recentReport } = await supabase
    .from('nightly_reports')
    .select('ai_insights, team_summary, report_date')
    .order('report_date', { ascending: false })
    .limit(1)
    .single()

  const hasPlayoffs = playoffWins + playoffLosses > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {format(today, 'EEEE, MMMM d, yyyy')} · {CURRENT_SEASON} Season
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {hasPlayoffs ? 'Regular Season' : 'Team Record'}
          </p>
          <p className="text-2xl font-bold text-white">
            <span className="text-lakers-gold">{wins}</span>
            <span className="text-gray-500 mx-1">–</span>
            <span>{losses}</span>
          </p>
          {hasPlayoffs && (
            <p className="text-xs text-gray-400 mt-1">
              Playoffs <span className="text-lakers-gold font-semibold">{playoffWins}</span>
              <span className="text-gray-600 mx-1">–</span>
              <span>{playoffLosses}</span>
              <span className="text-gray-600 ml-1">
                {playoffLosses === 4 && playoffWins >= 4 ? '· Eliminated R2' :
                 playoffLosses === 4 ? '· Eliminated R1' : '· In Playoffs'}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Off. Rating"
          value={teamStats.offRating > 0 ? teamStats.offRating.toFixed(1) : '—'}
          sublabel="Points per 100 possessions"
          accent="gold"
        />
        <StatCard
          label="True Shooting %"
          value={teamStats.trueShootingPct > 0 ? `${teamStats.trueShootingPct.toFixed(1)}%` : '—'}
          sublabel="Overall scoring efficiency"
        />
        <StatCard
          label="Turnover %"
          value={teamStats.turnoverRatio > 0 ? teamStats.turnoverRatio.toFixed(1) : '—'}
          sublabel="Turnovers per 100 possessions"
        />
        <StatCard
          label="Stocks / Game"
          value={teamStats.stocksPerGame > 0 ? teamStats.stocksPerGame.toFixed(1) : '—'}
          sublabel="Steals + blocks per game"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <PlayerSnapshotList
            players={roster.map(p => ({
              PLAYER_ID:    p.id,
              PLAYER_NAME:  p.fullName,
              PLAYER_POSITION: p.positionAbbr,
              PTS:          statsMap[p.id]?.pts ?? null,
              REB:          statsMap[p.id]?.reb ?? null,
              TS_PCT:       statsMap[p.id]?.ts_pct ?? null,
              STK:          statsMap[p.id]?.stocks ?? null,
              PLUS_MINUS:   statsMap[p.id]?.plus_minus ?? null,
            }))}
            userRole={profile?.role ?? 'analyst'}
          />
        </div>
        <div className="space-y-6">
          <UpcomingGamesESPN
            games={upcoming}
            recentGames={recentGames}
          />
          <AIInsightsFeed
            summary={recentReport?.team_summary}
            insights={recentReport?.ai_insights ?? []}
            reportDate={recentReport?.report_date}
          />
        </div>
      </div>
    </div>
  )
}
