import { cn, formatPct } from '@/lib/utils'

interface Props {
  stats: Record<string, unknown>
}

const STAT_GROUPS = [
  {
    label: 'Scoring',
    stats: [
      { key: 'PTS',      label: 'PPG',   format: 'decimal' },
      { key: 'TS_PCT',   label: 'TS%',   format: 'pct' },
      { key: 'EFG_PCT',  label: 'eFG%',  format: 'pct' },
      { key: 'FG_PCT',   label: 'FG%',   format: 'pct' },
      { key: 'FG3_PCT',  label: '3P%',   format: 'pct' },
      { key: 'FT_PCT',   label: 'FT%',   format: 'pct' },
    ],
  },
  {
    label: 'Playmaking',
    stats: [
      { key: 'AST',      label: 'APG',   format: 'decimal' },
      { key: 'TOV',      label: 'TOV',   format: 'decimal' },
      { key: 'AT_RATIO', label: 'A/TO',  format: 'decimal' },
      { key: 'STL',      label: 'SPG',   format: 'decimal' },
    ],
  },
  {
    label: 'Rebounding',
    stats: [
      { key: 'REB',      label: 'RPG',   format: 'decimal' },
      { key: 'OREB',     label: 'OREB',  format: 'decimal' },
      { key: 'DREB',     label: 'DREB',  format: 'decimal' },
    ],
  },
  {
    label: 'Defense & Impact',
    stats: [
      { key: 'STOCKS',      label: 'Stocks',  format: 'decimal' },
      { key: 'BLK',         label: 'BPG',     format: 'decimal' },
      { key: 'PLUS_MINUS',  label: '+/-',     format: 'plusminus' },
      { key: 'MIN',         label: 'MPG',     format: 'decimal' },
      { key: 'PF',          label: 'Fouls',   format: 'decimal' },
    ],
  },
]

function formatValue(value: unknown, format: string): string {
  const num = Number(value)
  if (isNaN(num) || (num === 0 && format === 'pct')) return '—'
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
              const isAdvanced = ['TS_PCT', 'EFG_PCT', 'AT_RATIO', 'STOCKS'].includes(key)
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className={cn('text-xs', isAdvanced ? 'text-lakers-gold/80' : 'text-gray-400')}>
                    {label}
                  </span>
                  <span className={cn(
                    'text-sm font-semibold',
                    format === 'plusminus' && num > 0 ? 'text-green-400' :
                    format === 'plusminus' && num < 0 ? 'text-red-400' :
                    isAdvanced ? 'text-white' :
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
