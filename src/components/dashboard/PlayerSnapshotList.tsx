import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PlayerSnapshotListProps {
  players: Record<string, unknown>[]
  userRole: string
}

export default function PlayerSnapshotList({ players, userRole }: PlayerSnapshotListProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0">Roster Snapshot</h3>
        <Link href="/players" className="text-xs text-lakers-gold hover:text-lakers-gold-light">
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-3">
              {['Player', 'POS', 'GP', 'PTS', 'REB', 'AST', 'FG%', 'TS%'].map(h => (
                <th key={h} className="text-left text-xs text-gray-500 pb-2 pr-4 font-medium last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-gray-500 text-sm py-4">
                  No player data available
                </td>
              </tr>
            ) : (
              players.map((p, i) => {
                const playerId = p.PLAYER_ID as number
                const fgPct = Number(p.FG_PCT) * 100
                const tsPct = p.TS_PCT ? Number(p.TS_PCT) * 100 : null

                return (
                  <tr key={i} className="border-b border-surface-3/50 last:border-0 hover:bg-surface-2/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/players/${playerId}`}
                        className="font-medium text-white hover:text-lakers-gold transition-colors"
                      >
                        {p.PLAYER_NAME as string}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400">{p.PLAYER_POSITION as string || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-300">{p.GP as number}</td>
                    <td className="py-2.5 pr-4 font-semibold text-white">{Number(p.PTS).toFixed(1)}</td>
                    <td className="py-2.5 pr-4 text-gray-300">{Number(p.REB).toFixed(1)}</td>
                    <td className="py-2.5 pr-4 text-gray-300">{Number(p.AST).toFixed(1)}</td>
                    <td className={cn('py-2.5 pr-4', fgPct >= 47 ? 'text-green-400' : fgPct < 40 ? 'text-red-400' : 'text-gray-300')}>
                      {fgPct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 text-gray-300">
                      {tsPct ? `${tsPct.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
