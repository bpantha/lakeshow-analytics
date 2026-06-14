import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { NBA_TEAMS } from '@/lib/nba/api'

export default async function ScoutingPage() {
  const supabase = createClient()

  const { data: reports } = await supabase
    .from('scouting_reports')
    .select('*')
    .order('game_date', { ascending: false })

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const canCreate = profile?.role === 'coach' || profile?.role === 'analyst'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-lakers-gold" />
          <div>
            <h1 className="text-2xl font-bold text-white">Scouting Reports</h1>
            <p className="text-sm text-gray-400">Opponent tendencies and game-plan breakdowns</p>
          </div>
        </div>
        {canCreate && (
          <Link href="/scouting/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        )}
      </div>

      {!reports || reports.length === 0 ? (
        <div className="card text-center py-16">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No scouting reports yet</p>
          <p className="text-gray-500 text-sm mt-1">Create a report for an upcoming opponent</p>
          {canCreate && (
            <Link href="/scouting/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Create First Report
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => {
            const team = NBA_TEAMS[report.opponent_team_id] ?? { name: `Team ${report.opponent_team_id}`, abbreviation: '???', city: '' }
            return (
              <Link key={report.id} href={`/scouting/${report.id}`}>
                <div className="card hover:border-lakers-purple/50 hover:bg-surface-2 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-lakers-purple/20 flex items-center justify-center">
                        <span className="text-lakers-gold font-bold text-sm">{team.abbreviation}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-lakers-gold transition-colors">
                          {team.city} {team.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {report.game_date ? format(parseISO(report.game_date), 'MMM d, yyyy') : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-t border-surface-3 text-xs">
                    <div>
                      <p className="text-gray-500">Off. Rating</p>
                      <p className="font-semibold text-white mt-0.5">{report.offensive_rating?.toFixed(1) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Def. Rating</p>
                      <p className="font-semibold text-white mt-0.5">{report.defensive_rating?.toFixed(1) ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">3P Rate</p>
                      <p className="font-semibold text-white mt-0.5">{report.three_point_rate ? `${(report.three_point_rate * 100).toFixed(0)}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pace Rank</p>
                      <p className="font-semibold text-white mt-0.5">#{report.pace_ranking ?? '—'}</p>
                    </div>
                  </div>

                  {report.ai_summary && (
                    <p className="text-xs text-gray-400 mt-3 line-clamp-2">{report.ai_summary}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
