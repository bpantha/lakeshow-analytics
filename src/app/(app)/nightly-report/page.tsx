import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { FileText, Sparkles } from 'lucide-react'
import GenerateReportButton from '@/components/reports/GenerateReportButton'
import { cn } from '@/lib/utils'

export default async function NightlyReportPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const canGenerate = profile?.role === 'coach' || profile?.role === 'analyst'

  const { data: reports } = await supabase
    .from('nightly_reports')
    .select('*')
    .order('report_date', { ascending: false })
    .limit(10)

  const latest = reports?.[0]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-lakers-gold" />
          <div>
            <h1 className="text-2xl font-bold text-white">Nightly Report</h1>
            <p className="text-sm text-gray-400">AI-generated team intelligence, delivered daily</p>
          </div>
        </div>
        {canGenerate && <GenerateReportButton />}
      </div>

      {/* Latest report */}
      {latest ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">
              {format(parseISO(latest.report_date), 'EEEE, MMMM d, yyyy')}
            </h2>
            <span className="badge-gold">Latest</span>
          </div>

          {/* Team summary */}
          <div className="card border-lakers-purple/30 bg-lakers-purple/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-lakers-gold" />
              <h3 className="text-sm font-semibold text-white">Team Summary</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{latest.team_summary}</p>
          </div>

          {/* AI Insights */}
          {latest.ai_insights?.length > 0 && (
            <div className="card">
              <h3 className="section-header">Key Insights</h3>
              <div className="space-y-3">
                {latest.ai_insights.map((insight: string, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-surface-2 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-lakers-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-lakers-gold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player highlights */}
          {latest.player_highlights?.length > 0 && (
            <div className="card">
              <h3 className="section-header">Player Highlights</h3>
              <div className="space-y-3">
                {latest.player_highlights.map((h: { player_name: string; headline: string; stat_line: string; trend: string; flag_type?: string }, i: number) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-surface-2 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-white">{h.player_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.headline}</p>
                      <p className="text-xs text-gray-500 mt-1">{h.stat_line}</p>
                    </div>
                    <div className="text-right">
                      {h.flag_type && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded font-medium',
                          h.flag_type === 'hot_streak' ? 'bg-green-900/40 text-green-400' :
                          h.flag_type === 'slump' ? 'bg-red-900/40 text-red-400' :
                          h.flag_type === 'milestone' ? 'bg-lakers-gold/20 text-lakers-gold' :
                          'bg-surface-3 text-gray-400'
                        )}>
                          {h.flag_type?.replace('_', ' ')}
                        </span>
                      )}
                      <p className={cn(
                        'text-lg font-bold mt-1',
                        h.trend === 'up' ? 'text-green-400' :
                        h.trend === 'down' ? 'text-red-400' :
                        'text-gray-400'
                      )}>
                        {h.trend === 'up' ? '↑' : h.trend === 'down' ? '↓' : '→'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opponent preview */}
          {latest.opponent_preview && (
            <div className="card">
              <h3 className="section-header">Upcoming Opponent Preview</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{latest.opponent_preview}</p>
            </div>
          )}

          {/* Injury updates */}
          {latest.injury_updates && (
            <div className="card">
              <h3 className="section-header">Injury Updates</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{latest.injury_updates}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No reports generated yet</p>
          {canGenerate && (
            <p className="text-gray-500 text-sm mt-1">Click "Generate Report" to create today's nightly report</p>
          )}
        </div>
      )}

      {/* Archive */}
      {reports && reports.length > 1 && (
        <div className="card">
          <h3 className="section-header">Report Archive</h3>
          <div className="space-y-1">
            {reports.slice(1).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 hover:bg-surface-2 rounded-lg transition-colors">
                <span className="text-sm text-gray-300">{format(parseISO(r.report_date), 'EEEE, MMMM d, yyyy')}</span>
                <span className="text-xs text-gray-500">
                  {r.ai_insights?.length ?? 0} insights
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
