import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: 'gold' | 'purple' | 'green'
  trend?: 'up' | 'down'
  rank?: number
}

export default function StatCard({ label, value, sublabel, accent, trend, rank }: StatCardProps) {
  return (
    <div className="card">
      <p className="stat-label">{label}</p>
      <p className={cn(
        'text-3xl font-bold mt-1',
        accent === 'gold' ? 'text-lakers-gold' :
        accent === 'purple' ? 'text-purple-300' :
        accent === 'green' ? 'text-green-400' :
        'text-white'
      )}>
        {value}
      </p>
      {rank != null && (
        <p className="text-xs font-semibold text-gray-500 mt-0.5">#{rank} in NBA</p>
      )}
      {sublabel && (
        <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
      )}
      {trend && (
        <span className={cn('text-xs font-medium', trend === 'up' ? 'text-green-400' : 'text-red-400')}>
          {trend === 'up' ? '↑' : '↓'} vs last game
        </span>
      )}
    </div>
  )
}
