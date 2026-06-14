import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import type { ESPNGame } from '@/lib/nba/espn'
import { ESPN_TEAM_ID } from '@/lib/nba/espn'

interface UpcomingGamesESPNProps {
  games: ESPNGame[]
}

export default function UpcomingGamesESPN({ games }: UpcomingGamesESPNProps) {
  return (
    <div className="card">
      <h3 className="section-header">Upcoming Games</h3>
      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">No upcoming games scheduled</p>
      ) : (
        <div className="space-y-3">
          {games.map(game => {
            const isHome = game.homeTeam.id === String(ESPN_TEAM_ID)
            const opponent = isHome ? game.awayTeam : game.homeTeam
            const gameDate = parseISO(game.date)

            return (
              <div key={game.id} className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">
                    {isHome ? 'vs' : '@'} {opponent.abbreviation}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(gameDate, 'MMM d')} · {opponent.city}
                  </p>
                </div>
                <Link
                  href="/scouting"
                  className="text-xs text-lakers-gold hover:text-lakers-gold-light transition-colors"
                >
                  Scout →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
