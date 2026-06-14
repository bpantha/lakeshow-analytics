import { cn, formatPct } from '@/lib/utils'

interface Props {
  stats: Record<string, unknown>
}

const STAT_GROUPS = [
  {
    label: 'Scoring',
    stats: [
      { key: 'PTS', label: 'PPG', format: 'decimal' },
      { key: 'FG_PCT', label: 'FG%', format: 'pct' },
      { key: 'FG3_PCT', label: '3P%', format: 'pct' },
      { key: 'FT_PCT', label: 'FT%', format: 'pct' },
      { key: 'TS_PCT', label: 'TS%', format: 'pct' },
    ],
  },
  {
    label: 'Playmaking',
    stats: [
      { key: 'AST', label: 'APG', format: 'decimal' },
      { key: 'TOV', label: 'TOV', format: 'decimal' },
      { key: 'STL', label: 'SPG', format: 'decimal' },
    ],
  },
  {
    label: 'Rebounding',
    stats: [
      { key: 'REB', label: 'RPG', format: 'decimal' },
      { key: 'OREB', label: 'OREB', format: 'decimal' },
      { key: 'DREB', label: 'DREB', format: 'decimal' },
    ],
  },
  {
    label: 'Defense & Misc',
    stats: [
      { key: 'BLK', label: 'BPG', format: 'decimal' },
      { key: 'PF', label: 'Fouls', format: 'decimal' },
      { key: 'MIN', label: 'MPG', format: 'decimal' },
      { key: 'PLUS_MINUS', label: '+/-', format: 'plusminus' },
    ],
  },
]

function formatValue(value: unknown, format: string): string {
  const num = Number(value)
  if (isNaN(num)) return '—'
  if (format === 'pct') return formatPct(num)
  if (format === 'plusminus') return num > 0 ? `+${num.toFixed(1)}` : num.toFixed(1)
  return num.toFixed(1)
}

export default function PlayerStatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {STAT_GROUPS.map(group => (
        <div key={group.label} className="card">
          <p className="section-header">{group.label}</p>
          <div className="space-y-3">
            {group.stats.map(({ key, label, format }) => {
              const val = stats[key]
              const num = Number(val)
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className={cn(
                    'text-sm font-semibold',
                    format === 'plusminus' && num > 0 ? 'text-green-400' :
                    format === 'plusminus' && num < 0 ? 'text-red-400' :
                    'text-white'
                  )}>
                    {formatValue(val, format)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
