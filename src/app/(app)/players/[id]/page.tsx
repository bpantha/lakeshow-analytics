import { createClient } from '@/lib/supabase/server'
import { getESPNRoster, getESPNPlayerStats, getESPNRosterStats } from '@/lib/nba/espn'
import { notFound } from 'next/navigation'
import PlayerStatsGrid from '@/components/players/PlayerStatsGrid'
import DevelopmentGoals from '@/components/players/DevelopmentGoals'
import BenchmarkChart from '@/components/players/BenchmarkChart'
import CoachNotes from '@/components/players/CoachNotes'

export const revalidate = 3600

interface Props {
  params: { id: string }
}

export default async function PlayerPage({ params }: Props) {
  const espnId = params.id
  if (!espnId) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const isCoachOrAnalyst = profile?.role === 'coach' || profile?.role === 'analyst'

  // Get roster to find this player
  const roster = await getESPNRoster().catch(() => [])
  const player = roster.find(p => p.id === espnId)
  if (!player) notFound()

  const playerAvg = await getESPNPlayerStats(espnId).catch(() => null)
  const allRosterStats = await getESPNRosterStats(roster).catch(() => ({}))

  const { data: goals } = await supabase
    .from('development_goals')
    .select('*')
    .eq('player_id', espnId)
    .order('created_at', { ascending: false })

  const { data: notes } = await supabase
    .from('coach_notes')
    .select('*')
    .eq('subject_id', espnId)
    .eq('subject_type', 'player')
    .order('created_at', { ascending: false })

  type StatKey = 'pts' | 'reb' | 'ast' | 'fg_pct' | 'fg3_pct' | 'ft_pct'

  function calcBenchmark(key: StatKey, label: string, unit = '') {
    if (!playerAvg) return null
    const playerVal = playerAvg[key] ?? 0
    const vals = Object.values(allRosterStats)
      .map(p => p[key] ?? 0)
      .filter(v => v > 0)
      .sort((a, b) => a - b)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const idx = vals.findIndex(v => v >= playerVal)
    const percentile = vals.length ? Math.round((idx / vals.length) * 100) : 50
    return { stat_name: label, player_value: playerVal, position_avg: avg, league_avg: avg, percentile, unit }
  }

  const benchmarks = playerAvg ? [
    calcBenchmark('pts', 'PTS', 'PPG'),
    calcBenchmark('reb', 'REB', 'RPG'),
    calcBenchmark('ast', 'AST', 'APG'),
    calcBenchmark('fg_pct', 'FG%', '%'),
    calcBenchmark('fg3_pct', '3P%', '%'),
    calcBenchmark('ft_pct', 'FT%', '%'),
  ].filter(Boolean) as NonNullable<ReturnType<typeof calcBenchmark>>[] : []

  const stats = playerAvg ? {
    PTS: playerAvg.pts,
    REB: playerAvg.reb,
    AST: playerAvg.ast,
    STL: playerAvg.stl,
    BLK: playerAvg.blk,
    TOV: playerAvg.turnover,
    OREB: playerAvg.oreb,
    DREB: playerAvg.dreb,
    FG_PCT: playerAvg.fg_pct,
    FG3_PCT: playerAvg.fg3_pct,
    FT_PCT: playerAvg.ft_pct,
    PF: playerAvg.pf,
    MIN: playerAvg.min,
    GP: playerAvg.gamesPlayed,
    PLUS_MINUS: playerAvg.plus_minus,
    TS_PCT: playerAvg.ts_pct,
  } : {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {player.headshot && (
            <img
              src={player.headshot}
              alt={player.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-lakers-purple/40"
            />
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Player Profile</p>
            <h1 className="text-3xl font-bold text-white">{player.fullName}</h1>
            <div className="flex items-center gap-3 mt-1">
              {player.positionAbbr && <span className="badge-purple">{player.positionAbbr}</span>}
              {player.jersey && <span className="text-xs text-gray-400">#{player.jersey}</span>}
              {playerAvg?.gamesPlayed != null && (
                <span className="text-xs text-gray-400">{playerAvg.gamesPlayed} GP</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          {playerAvg?.pts != null && (
            <div>
              <p className="text-4xl font-black text-lakers-gold">{playerAvg.pts.toFixed(1)}</p>
              <p className="text-xs text-gray-400">PPG</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {playerAvg ? (
        <PlayerStatsGrid stats={stats} />
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">No season stats available yet.</p>
        </div>
      )}

      {/* Benchmarks */}
      <div className="grid grid-cols-2 gap-6">
        <BenchmarkChart benchmarks={benchmarks} playerName={player.fullName} />
        <div className="card flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Shot chart coming soon</p>
            <p className="text-xs text-gray-600 mt-1">Live shot data from NBA Stats API</p>
          </div>
        </div>
      </div>

      {/* Development goals */}
      <DevelopmentGoals
        goals={goals ?? []}
        playerId={espnId}
        playerName={player.fullName}
        canEdit={isCoachOrAnalyst}
      />

      {/* Coach notes */}
      {isCoachOrAnalyst && (
        <CoachNotes
          notes={notes ?? []}
          subjectId={espnId}
          subjectType="player"
          authorId={user!.id}
          authorName={profile?.full_name ?? ''}
          userRole={profile?.role}
        />
      )}
    </div>
  )
}
