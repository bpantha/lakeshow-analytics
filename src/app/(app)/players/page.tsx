import { getESPNRoster, getESPNRosterStats, type ESPNPlayerStats } from '@/lib/nba/espn'
import Link from 'next/link'
import { Users } from 'lucide-react'

export const revalidate = 3600

export default async function PlayersPage() {
  const roster = await getESPNRoster().catch(() => [])
  const statsMap: Record<string, ESPNPlayerStats> = roster.length > 0
    ? await getESPNRosterStats(roster).catch(() => ({} as Record<string, ESPNPlayerStats>))
    : {}

  // Sort by points descending, players without stats go last
  const sorted = [...roster].sort((a, b) => {
    const aPts = statsMap[a.id]?.pts ?? -1
    const bPts = statsMap[b.id]?.pts ?? -1
    return bPts - aPts
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-lakers-gold" />
        <div>
          <h1 className="text-2xl font-bold text-white">Players</h1>
          <p className="text-sm text-gray-400">{roster.length} roster members · 2025-26 Season</p>
        </div>
      </div>

      {roster.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-400">Unable to load roster from ESPN.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(player => {
          const stats = statsMap[player.id]
          const pts = stats?.pts != null ? stats.pts.toFixed(1) : '—'
          const reb = stats?.reb != null ? stats.reb.toFixed(1) : '—'
          const ast = stats?.ast != null ? stats.ast.toFixed(1) : '—'
          const fgPct = stats?.fg_pct != null ? `${(stats.fg_pct * 100).toFixed(1)}%` : '—'

          return (
            <Link key={player.id} href={`/players/${player.id}`}>
              <div className="card hover:border-lakers-purple/50 hover:bg-surface-2 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {player.headshot ? (
                      <img
                        src={player.headshot}
                        alt={player.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-lakers-purple/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-lakers-purple/30 border border-lakers-purple/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-lakers-gold">
                          {player.jersey ? `#${player.jersey}` : player.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white group-hover:text-lakers-gold transition-colors leading-tight">
                        {player.fullName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{player.positionAbbr || '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {stats?.gamesPlayed ? `${stats.gamesPlayed}G` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-3 border-t border-surface-3">
                  {[['PTS', pts], ['REB', reb], ['AST', ast], ['FG%', fgPct]].map(([label, val]) => (
                    <div key={label} className="text-center">
                      <p className="text-sm font-bold text-white">{val}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
