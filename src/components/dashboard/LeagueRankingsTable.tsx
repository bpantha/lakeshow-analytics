import { cn } from '@/lib/utils'
import { type ESPNLeagueTeamStats } from '@/lib/nba/espn'

interface Props {
  standings: ESPNLeagueTeamStats[]
}

const LAKERS_ID = 13

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function RankBadge({ rank, total = 30 }: { rank: number; total?: number }) {
  const pct = (rank - 1) / (total - 1)
  const color =
    pct <= 0.2 ? 'text-green-400' :
    pct >= 0.7 ? 'text-red-400' :
    'text-gray-400'
  return <span className={cn('text-xs', color)}>{ordinal(rank)}</span>
}

export default function LeagueRankingsTable({ standings }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0">League Rankings</h3>
        <span className="text-xs text-gray-500">2025-26 Regular Season · sorted by Net Rating</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-3">
              <th className="text-left text-xs text-gray-500 pb-2 pr-3 font-medium w-8">#</th>
              <th className="text-left text-xs text-gray-500 pb-2 pr-6 font-medium">Team</th>
              <th className="text-right text-xs text-gray-500 pb-2 pr-6 font-medium">Net Rtg</th>
              <th className="text-right text-xs text-gray-500 pb-2 pr-6 font-medium">ORtg</th>
              <th className="text-right text-xs text-gray-500 pb-2 pr-6 font-medium">
                DRtg <span className="text-gray-600">↓</span>
              </th>
              <th className="text-right text-xs text-gray-500 pb-2 pr-6 font-medium">TS%</th>
              <th className="text-right text-xs text-gray-500 pb-2 font-medium">TOV%</th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 text-sm">
                  Loading league data…
                </td>
              </tr>
            ) : (
              standings.map((team, i) => {
                const isLakers = team.teamId === LAKERS_ID
                return (
                  <tr
                    key={team.teamId}
                    className={cn(
                      'border-b border-surface-3/40 last:border-0 transition-colors',
                      isLakers ? 'bg-lakers-gold/5' : 'hover:bg-surface-2/30'
                    )}
                  >
                    <td className="py-2 pr-3 text-gray-600 text-xs font-medium">{i + 1}</td>
                    <td className="py-2 pr-6">
                      <span className={cn(
                        'font-bold text-sm',
                        isLakers ? 'text-lakers-gold' : 'text-white'
                      )}>
                        {team.abbr}
                      </span>
                      {isLakers && <span className="text-lakers-gold/50 ml-1.5 text-xs">★</span>}
                    </td>
                    <td className={cn(
                      'py-2 pr-6 text-right font-bold',
                      team.netRating > 2 ? 'text-green-400' :
                      team.netRating > 0 ? 'text-green-300' :
                      team.netRating < 0 ? 'text-red-400' :
                      'text-gray-300'
                    )}>
                      {team.netRating > 0 ? `+${team.netRating.toFixed(1)}` : team.netRating.toFixed(1)}
                    </td>
                    <td className="py-2 pr-6 text-right">
                      <span className={cn('font-medium', isLakers ? 'text-white' : 'text-gray-300')}>
                        {team.offRating.toFixed(1)}
                      </span>
                      {' '}
                      <RankBadge rank={team.ortgRank} />
                    </td>
                    <td className="py-2 pr-6 text-right">
                      <span className={cn('font-medium', isLakers ? 'text-white' : 'text-gray-300')}>
                        {team.defRating.toFixed(1)}
                      </span>
                      {' '}
                      <RankBadge rank={team.drtgRank} />
                    </td>
                    <td className="py-2 pr-6 text-right">
                      <span className={cn('font-medium', isLakers ? 'text-white' : 'text-gray-300')}>
                        {team.trueShootingPct.toFixed(1)}%
                      </span>
                      {' '}
                      <RankBadge rank={team.tsRank} />
                    </td>
                    <td className="py-2 text-right">
                      <span className={cn('font-medium', isLakers ? 'text-white' : 'text-gray-300')}>
                        {team.turnoverRatio.toFixed(1)}
                      </span>
                      {' '}
                      <RankBadge rank={team.tovRank} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 mt-3">
        DRtg ↓ lower is better · rank badges: <span className="text-green-400">top 20%</span> / <span className="text-red-400">bottom 30%</span>
      </p>
    </div>
  )
}
