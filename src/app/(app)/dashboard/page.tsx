import { createClient } from '@/lib/supabase/server'
import {
  getESPNRoster,
  getESPNRosterStats,
  getLakersSchedule,
  getLakersRecord,
  getUpcomingESPNGames,
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

  const roster = await getESPNRoster().catch(() => [])
  const statsMap: Record<string, ESPNPlayerStats> = roster.length > 0
    ? await getESPNRosterStats(roster).catch(() => ({} as Record<string, ESPNPlayerStats>))
    : {}
  const schedule = await getLakersSchedule().catch(() => [])

  const { wins, losses } = getLakersRecord(schedule)
  const upcoming = getUpcomingESPNGames(schedule, 5)

  // Aggregate team stats from roster averages
  const statValues = Object.values(statsMap)
  const teamPpg = statValues.reduce((s, p) => s + (p.pts ?? 0), 0)
  const teamRpg = statValues.reduce((s, p) => s + (p.reb ?? 0), 0)
  const teamApg = statValues.reduce((s, p) => s + (p.ast ?? 0), 0)

  const { data: recentReport } = await supabase
    .from('nightly_reports')
    .select('ai_insights, team_summary, report_date')
    .order('report_date', { ascending: false })
    .limit(1)
    .single()

  const gamesPlayed = wins + losses

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
          <p className="text-xs text-gray-500 uppercase tracking-wider">Team Record</p>
          <p className="text-2xl font-bold text-white">
            <span className="text-lakers-gold">{wins}</span>
            <span className="text-gray-500 mx-1">–</span>
            <span>{losses}</span>
          </p>
          {gamesPlayed > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">{gamesPlayed} games played</p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Roster Size" value={String(roster.length || '—')} sublabel="Active players" />
        <StatCard
          label="Team PPG"
          value={teamPpg > 0 ? teamPpg.toFixed(1) : '—'}
          sublabel="2025-26 season"
          accent="gold"
        />
        <StatCard
          label="Team RPG"
          value={teamRpg > 0 ? teamRpg.toFixed(1) : '—'}
          sublabel="2025-26 season"
        />
        <StatCard
          label="Team APG"
          value={teamApg > 0 ? teamApg.toFixed(1) : '—'}
          sublabel="2025-26 season"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <PlayerSnapshotList
            players={roster.map(p => ({
              PLAYER_ID: p.id,
              PLAYER_NAME: p.fullName,
              PLAYER_POSITION: p.positionAbbr,
              NUM: p.jersey,
              GP: statsMap[p.id]?.gamesPlayed ?? null,
              PTS: statsMap[p.id]?.pts ?? null,
              REB: statsMap[p.id]?.reb ?? null,
              AST: statsMap[p.id]?.ast ?? null,
              FG_PCT: statsMap[p.id]?.fg_pct ?? null,
              TS_PCT: statsMap[p.id]?.ts_pct ?? null,
            }))}
            userRole={profile?.role ?? 'analyst'}
          />
        </div>
        <div className="space-y-6">
          <UpcomingGamesESPN games={upcoming} />
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
