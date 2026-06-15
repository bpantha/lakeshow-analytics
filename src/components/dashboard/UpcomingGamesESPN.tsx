import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import type { ESPNGame } from '@/lib/nba/espn'
import { ESPN_TEAM_ID } from '@/lib/nba/espn'

interface UpcomingGamesESPNProps {
  games: ESPNGame[]
  recentGames?: ESPNGame[]
}

function GameRow({ game, showResult }: { game: ESPNGame; showResult: boolean }) {
  const lakersId = String(ESPN_TEAM_ID)
  const isHome = game.homeTeam.id === lakersId
  const opponent = isHome ? game.awayTeam : game.homeTeam
  const lakersScore = isHome ? game.homeTeam.score : game.awayTeam.score
  const oppScore = isHome ? game.awayTeam.score : game.homeTeam.score
  const won = lakersScore > oppScore
  const gameDate = parseISO(game.date)

  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">
          {isHome ? 'vs' : '@'} {opponent.abbreviation}
        </p>
        <p className="text-xs text-gray-500">
          {format(gameDate, 'MMM d')} · {opponent.city}
        </p>
      </div>
      {showResult ? (
        <div className="text-right">
          <span className={`text-xs font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
            {won ? 'W' : 'L'}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {lakersScore}–{oppScore}
          </span>
        </div>
      ) : (
        <Link
          href="/scouting"
          className="text-xs text-lakers-gold hover:text-lakers-gold-light transition-colors"
        >
          Scout →
        </Link>
      )}
    </div>
  )
}

export default function UpcomingGamesESPN({ games, recentGames = [] }: UpcomingGamesESPNProps) {
  const isOffseason = games.length === 0
  const displayGames = isOffseason ? recentGames : games

  return (
    <div className="card">
      <h3 className="section-header">{isOffseason ? 'Recent Results' : 'Upcoming Games'}</h3>
      {displayGames.length === 0 ? (
        <p className="text-gray-500 text-sm">No games scheduled</p>
      ) : (
        <div className="space-y-1">
          {displayGames.map(game => (
            <GameRow key={game.id} game={game} showResult={isOffseason} />
          ))}
        </div>
      )}
    </div>
  )
}
