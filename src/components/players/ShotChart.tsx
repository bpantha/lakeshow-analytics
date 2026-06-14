'use client'

import { useMemo } from 'react'

interface ShotChartProps {
  data: Record<string, unknown>[]
}

const COURT_WIDTH = 500
const COURT_HEIGHT = 470
const SCALE = 10

function courtX(x: number) {
  return COURT_WIDTH / 2 + x / SCALE
}

function courtY(y: number) {
  return COURT_HEIGHT - 40 - y / SCALE
}

export default function ShotChart({ data }: ShotChartProps) {
  const shots = useMemo(() => {
    return data.map(shot => ({
      x: courtX(Number(shot.LOC_X ?? 0)),
      y: courtY(Number(shot.LOC_Y ?? 0)),
      made: shot.SHOT_MADE_FLAG === 1,
    }))
  }, [data])

  if (data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">No shot chart data available</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-header mb-0">Shot Chart</h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-lakers-gold inline-block" /> Made
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/60 inline-block" /> Missed
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg bg-surface-2">
        <svg
          viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
          className="w-full"
          style={{ maxHeight: 300 }}
        >
          {/* Court outline */}
          <rect x="0" y="0" width={COURT_WIDTH} height={COURT_HEIGHT} fill="#1a1a24" />

          {/* Half court line */}
          <line x1="0" y1={COURT_HEIGHT / 2} x2={COURT_WIDTH} y2={COURT_HEIGHT / 2} stroke="#2e2e48" strokeWidth="1" />

          {/* Key / paint */}
          <rect x={COURT_WIDTH/2 - 8*SCALE} y={COURT_HEIGHT - 40 - 19*SCALE} width={16*SCALE} height={19*SCALE} fill="none" stroke="#2e2e48" strokeWidth="1.5" />

          {/* Free throw circle */}
          <circle cx={COURT_WIDTH/2} cy={COURT_HEIGHT - 40 - 19*SCALE} r={6*SCALE} fill="none" stroke="#2e2e48" strokeWidth="1.5" />

          {/* Three point arc (simplified) */}
          <path
            d={`M ${COURT_WIDTH/2 - 22*SCALE} ${COURT_HEIGHT - 40} A ${23.75*SCALE} ${23.75*SCALE} 0 0 1 ${COURT_WIDTH/2 + 22*SCALE} ${COURT_HEIGHT - 40}`}
            fill="none" stroke="#2e2e48" strokeWidth="1.5"
          />
          {/* Three point corner lines */}
          <line x1={COURT_WIDTH/2 - 22*SCALE} y1={COURT_HEIGHT - 40} x2={COURT_WIDTH/2 - 22*SCALE} y2={COURT_HEIGHT - 40 - 14*SCALE} stroke="#2e2e48" strokeWidth="1.5" />
          <line x1={COURT_WIDTH/2 + 22*SCALE} y1={COURT_HEIGHT - 40} x2={COURT_WIDTH/2 + 22*SCALE} y2={COURT_HEIGHT - 40 - 14*SCALE} stroke="#2e2e48" strokeWidth="1.5" />

          {/* Basket */}
          <circle cx={COURT_WIDTH/2} cy={COURT_HEIGHT - 40} r={7.5} fill="none" stroke="#552583" strokeWidth="2" />

          {/* Shot dots */}
          {shots.map((shot, i) => (
            <circle
              key={i}
              cx={shot.x}
              cy={shot.y}
              r={4}
              fill={shot.made ? '#FDB927' : 'rgba(239,68,68,0.5)'}
              opacity={0.75}
            />
          ))}
        </svg>
      </div>
      <p className="text-xs text-gray-500 mt-2">{data.length} shot attempts plotted</p>
    </div>
  )
}
