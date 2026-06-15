import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PlayerSnapshotListProps {
  players: Record<string, unknown>[]
  userRole: string
}

export default function PlayerSnapshotList({ players, userRole: _userRole }: PlayerSnapshotListProps) {
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
              {['Player', 'POS', 'PTS', 'REB', 'TS%', 'STK', '+/-'].map(h => (
                <th key={h} className={cn(
                  'text-xs text-gray-500 pb-2 pr-4 font-medium last:pr-0',
                  h === 'Player' ? 'text-left' : 'text-right'
                )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-gray-500 text-sm py-4">
                  No player data available
                </td>
              </tr>
            ) : (
              players.map((p, i) => {
                const playerId = p.PLAYER_ID as string
                const tsPct = p.TS_PCT ? Number(p.TS_PCT) * 100 : null
                const stk = p.STK ? Number(p.STK) : null
                const pm = p.PLUS_MINUS != null ? Number(p.PLUS_MINUS) : null
                const pts = Number(p.PTS)
                const reb = Number(p.REB)

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
                    <td className="py-2.5 pr-4 text-right text-gray-400 text-xs">{p.PLAYER_POSITION as string || '—'}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-white">
                      {isNaN(pts) ? '—' : pts.toFixed(1)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-gray-300">
                      {isNaN(reb) ? '—' : reb.toFixed(1)}
                    </td>
                    <td className={cn(
                      'py-2.5 pr-4 text-right',
                      tsPct != null && tsPct >= 60 ? 'text-green-400' :
                      tsPct != null && tsPct < 52 ? 'text-red-400' :
                      'text-gray-300'
                    )}>
                      {tsPct != null ? `${tsPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-gray-300">
                      {stk != null ? stk.toFixed(1) : '—'}
                    </td>
                    <td className={cn(
                      'py-2.5 text-right font-medium',
                      pm != null && pm > 0 ? 'text-green-400' :
                      pm != null && pm < 0 ? 'text-red-400' :
                      'text-gray-500'
                    )}>
                      {pm != null ? (pm > 0 ? `+${Math.round(pm)}` : String(Math.round(pm))) : '—'}
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
