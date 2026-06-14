interface Props {
  stats: Record<string, unknown>
  teamName: string
}

const STAT_ROWS = [
  { key: 'PTS', label: 'Points Per Game' },
  { key: 'REB', label: 'Rebounds Per Game' },
  { key: 'AST', label: 'Assists Per Game' },
  { key: 'STL', label: 'Steals Per Game' },
  { key: 'BLK', label: 'Blocks Per Game' },
  { key: 'TOV', label: 'Turnovers Per Game' },
  { key: 'FG_PCT', label: 'Field Goal %', pct: true },
  { key: 'FG3_PCT', label: '3-Point %', pct: true },
  { key: 'FT_PCT', label: 'Free Throw %', pct: true },
  { key: 'PACE', label: 'Pace' },
]

export default function ScoutingStatsPanel({ stats, teamName }: Props) {
  return (
    <div className="card">
      <h3 className="section-header">Live Team Stats — {teamName}</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        {STAT_ROWS.map(({ key, label, pct }) => {
          const val = Number(stats[key])
          if (isNaN(val)) return null
          return (
            <div key={key} className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-sm font-semibold text-white">
                {pct ? `${(val * 100).toFixed(1)}%` : val.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
