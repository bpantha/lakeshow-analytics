import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { NBA_TEAMS, getTeamStats } from '@/lib/nba/api'
import { format, parseISO } from 'date-fns'
import { Sparkles, Shield } from 'lucide-react'
import CoachNotes from '@/components/players/CoachNotes'
import ScoutingStatsPanel from '@/components/scouting/ScoutingStatsPanel'

export const revalidate = 3600

interface Props {
  params: { id: string }
}

export default async function ScoutingReportPage({ params }: Props) {
  const supabase = createClient()
  const { data: report } = await supabase
    .from('scouting_reports')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!report) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: notes } = await supabase
    .from('coach_notes')
    .select('*')
    .eq('subject_id', params.id)
    .eq('subject_type', 'opponent')
    .order('created_at', { ascending: false })

  let liveStats: Record<string, unknown> | null = null
  try { liveStats = await getTeamStats(report.opponent_team_id) } catch {}

  const team = NBA_TEAMS[report.opponent_team_id] ?? { name: `Team ${report.opponent_team_id}`, abbreviation: '???', city: '' }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-lakers-purple/20 border border-lakers-purple/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-lakers-gold" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Scouting Report</p>
            <h1 className="text-3xl font-bold text-white">{team.city} {team.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="badge-purple">{team.abbreviation}</span>
              {report.game_date && (
                <span className="text-xs text-gray-400">
                  Game: {format(parseISO(report.game_date), 'EEEE, MMMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Offensive Rating', value: report.offensive_rating?.toFixed(1) ?? '—', sub: 'Points per 100 poss.' },
          { label: 'Defensive Rating', value: report.defensive_rating?.toFixed(1) ?? '—', sub: 'Points allowed per 100' },
          { label: '3-Point Rate', value: report.three_point_rate ? `${(report.three_point_rate * 100).toFixed(0)}%` : '—', sub: 'FGA from 3' },
          { label: 'Pace Rank', value: report.pace_ranking ? `#${report.pace_ranking}` : '—', sub: 'League pace ranking' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="stat-label">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tendencies */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-header">Offensive Tendencies</h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {report.offensive_tendencies || 'No offensive tendencies noted yet.'}
          </p>
        </div>
        <div className="card">
          <h3 className="section-header">Defensive Tendencies</h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {report.defensive_tendencies || 'No defensive tendencies noted yet.'}
          </p>
        </div>
      </div>

      {/* Key players */}
      {report.key_players?.length > 0 && (
        <div className="card">
          <h3 className="section-header">Key Players to Watch</h3>
          <div className="flex flex-wrap gap-2">
            {report.key_players.map((player: string) => (
              <span key={player} className="badge-gold">{player}</span>
            ))}
          </div>
        </div>
      )}

      {/* Live NBA stats */}
      {liveStats && <ScoutingStatsPanel stats={liveStats} teamName={`${team.city} ${team.name}`} />}

      {/* AI Summary */}
      {report.ai_summary && (
        <div className="card border-lakers-purple/30 bg-lakers-purple/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-lakers-gold" />
            <h3 className="text-sm font-semibold text-white">AI Scouting Summary</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{report.ai_summary}</p>
        </div>
      )}

      {/* Coach notes */}
      {(profile?.role === 'coach' || profile?.role === 'analyst') && (
        <CoachNotes
          notes={notes ?? []}
          subjectId={params.id}
          subjectType="opponent"
          authorId={user!.id}
          authorName={profile?.full_name ?? ''}
          userRole={profile?.role}
        />
      )}
    </div>
  )
}
