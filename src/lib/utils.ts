import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStat(value: number, decimals = 1): string {
  return value.toFixed(decimals)
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  return trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
}

export function getTrendArrow(trend: 'up' | 'down' | 'stable'): string {
  return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
}

export function getPercentileColor(percentile: number): string {
  if (percentile >= 75) return 'text-green-400'
  if (percentile >= 50) return 'text-lakers-gold'
  if (percentile >= 25) return 'text-orange-400'
  return 'text-red-400'
}

export function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length < 2) return fullName
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}
