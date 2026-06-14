import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import type { BDLGame } from '@/lib/nba/balldontlie'
import { LAKERS_TEAM_ID } from '@/lib/nba/balldontlie'

interface UpcomingGamesProps {
  games: BDLGame[]
}

export default function UpcomingGames({ games }: UpcomingGamesProps) {
  return (
    <div className="card">
      <h3 className="section-header">Upcoming Games</h3>
      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">Schedule loads once the season begins</p>
      ) : (
        <div className="space-y-3">
          {games.map(game => {
            const isHome = game.home_team.id === LAKERS_TEAM_ID
            const opponent = isHome ? game.visitor_team : game.home_team
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
                  href={`/scouting`}
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
