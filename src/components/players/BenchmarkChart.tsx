'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { getPercentileColor } from '@/lib/utils'

interface Benchmark {
  stat_name: string
  player_value: number
  position_avg: number
  league_avg: number
  percentile: number
  unit: string
}

interface Props {
  benchmarks: Benchmark[]
  playerName: string
}

const STAT_LABELS: Record<string, string> = {
  PTS:        'Scoring',
  REB:        'Rebounds',
  AST:        'Assists',
  STL:        'Steals',
  TS_PCT:     'TS%',
  PLUS_MINUS: '+/-',
}

export default function BenchmarkChart({ benchmarks, playerName }: Props) {
  const radarData = benchmarks.map(b => ({
    subject: STAT_LABELS[b.stat_name] ?? b.stat_name,
    percentile: b.percentile,
  }))

  return (
    <div className="card">
      <h3 className="section-header">League Benchmarks</h3>
      <p className="text-xs text-gray-500 mb-4">Percentile vs positional average</p>

      {benchmarks.length === 0 ? (
        <p className="text-gray-500 text-sm">No benchmark data available</p>
      ) : (
        <>
          <div className="h-52 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2e2e48" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <Radar
                  name={playerName}
                  dataKey="percentile"
                  stroke="#FDB927"
                  fill="#FDB927"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#1e1e2a', border: '1px solid #2e2e48', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [`${v}th percentile`, '']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {benchmarks.map(b => (
              <div key={b.stat_name} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{STAT_LABELS[b.stat_name] ?? b.stat_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">
                    Avg: {b.stat_name.includes('PCT') ? `${(b.position_avg * 100).toFixed(1)}%` : b.position_avg.toFixed(1)}
                  </span>
                  <span className={`font-semibold ${getPercentileColor(b.percentile)}`}>
                    {b.percentile}th %ile
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
