import { notFound } from 'next/navigation'
import { getGameSummary, type ESPNBoxScorePlayer, type ESPNBoxScoreTeam } from '@/lib/nba/espn'
import { generateGameAnalysis } from '@/lib/groq/insights'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const revalidate = 3600

export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const summary = await getGameSummary(params.id)
  if (!summary) notFound()

  const allPlayers = [
    ...summary.homeTeam.players.map(p => ({ ...p, teamAbbr: summary.homeTeam.abbreviation })),
    ...summary.awayTeam.players.map(p => ({ ...p, teamAbbr: summary.awayTeam.abbreviation })),
  ].filter(p => !p.dnp).sort((a, b) => b.pts - a.pts).slice(0, 6)

  // summary.date is already YYYY-MM-DD in local (Pacific) time from espn.ts
  const gameDate = summary.date
    ? format(parseISO(summary.date), 'MMMM d, yyyy')
    : ''

  const aiAnalysis = await generateGameAnalysis({
    gameId: summary.gameId,
    homeTeam: summary.homeTeam,
    awayTeam: summary.awayTeam,
    topPerformers: allPlayers.map(p => ({
      name: p.name,
      team: p.teamAbbr,
      pts: p.pts,
      reb: p.reb,
      ast: p.ast,
      plusMinus: p.plusMinus,
    })),
    isPlayoff: summary.isPlayoff,
    date: gameDate,
  }).catch((err) => {
    console.error('[GameDetail] generateGameAnalysis failed:', err?.message ?? err)
    return ''
  })

  const homeWon = summary.homeTeam.score > summary.awayTeam.score
  const lakersIsHome = summary.homeTeam.abbreviation === 'LAL'
  const lakersTeam = lakersIsHome ? summary.homeTeam : summary.awayTeam
  const oppTeam = lakersIsHome ? summary.awayTeam : summary.homeTeam
  const lakersWon = lakersTeam.score > oppTeam.score

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Game header */}
      <div className="card">
        <div className="flex items-center justify-between">
          {/* Away team */}
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-1">{summary.awayTeam.city}</p>
            <p className="text-2xl font-bold text-white">{summary.awayTeam.abbreviation}</p>
            <p className={cn(
              'text-4xl font-bold mt-2',
              homeWon ? 'text-gray-500' : 'text-white'
            )}>
              {summary.awayTeam.score}
            </p>
          </div>

          {/* Center info */}
          <div className="text-center px-6">
            {summary.isPlayoff && (
              <span className="badge-gold text-xs mb-2 block">Playoffs</span>
            )}
            <p className="text-sm font-semibold text-gray-400">FINAL</p>
            {gameDate && (
              <p className="text-xs text-gray-600 mt-1">{gameDate}</p>
            )}
          </div>

          {/* Home team */}
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-1">{summary.homeTeam.city}</p>
            <p className="text-2xl font-bold text-white">{summary.homeTeam.abbreviation}</p>
            <p className={cn(
              'text-4xl font-bold mt-2',
              homeWon ? 'text-white' : 'text-gray-500'
            )}>
              {summary.homeTeam.score}
            </p>
          </div>
        </div>

        {/* Lakers result banner */}
        <div className={cn(
          'mt-4 text-center py-2 rounded-lg text-sm font-semibold',
          lakersWon
            ? 'bg-green-900/20 text-green-400'
            : 'bg-red-900/20 text-red-400'
        )}>
          Lakers {lakersWon ? 'Win' : 'Loss'} · {lakersTeam.score}–{oppTeam.score}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="card border-lakers-purple/30 bg-lakers-purple/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-lakers-gold" />
          <h3 className="text-sm font-semibold text-white">AI Game Analysis</h3>
        </div>
        {aiAnalysis ? (
          <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis}</p>
        ) : (
          <p className="text-sm text-gray-500 italic">Analysis unavailable for this game.</p>
        )}
      </div>

      {/* Box scores — Lakers first */}
      <BoxScoreCard team={lakersTeam} isHome={lakersIsHome} />
      <BoxScoreCard team={oppTeam} isHome={!lakersIsHome} />
    </div>
  )
}

function BoxScoreCard({ team, isHome }: { team: ESPNBoxScoreTeam; isHome: boolean }) {
  const starters = team.players.filter(p => p.starter && !p.dnp)
  const bench = team.players.filter(p => !p.starter && !p.dnp)
  const dnp = team.players.filter(p => p.dnp)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0">
          {team.city} {team.abbreviation}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{isHome ? 'Home' : 'Away'}</span>
          <span className="text-2xl font-bold text-white">{team.score}</span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="text-gray-500 border-b border-surface-3">
              <th className="text-left py-2 pr-4 font-medium w-36">Player</th>
              <th className="text-right py-2 px-2 font-medium">MIN</th>
              <th className="text-right py-2 px-2 font-medium">PTS</th>
              <th className="text-right py-2 px-2 font-medium">FG</th>
              <th className="text-right py-2 px-2 font-medium">3PT</th>
              <th className="text-right py-2 px-2 font-medium">FT</th>
              <th className="text-right py-2 px-2 font-medium">REB</th>
              <th className="text-right py-2 px-2 font-medium">AST</th>
              <th className="text-right py-2 px-2 font-medium">TO</th>
              <th className="text-right py-2 px-2 font-medium">STL</th>
              <th className="text-right py-2 px-2 font-medium">BLK</th>
              <th className="text-right py-2 px-2 font-medium">PF</th>
              <th className="text-right py-2 px-2 font-medium">+/-</th>
            </tr>
          </thead>
          <tbody>
            {starters.length > 0 && (
              <>
                <tr>
                  <td colSpan={13} className="py-1.5 text-xs text-gray-600 uppercase tracking-wider font-medium">
                    Starters
                  </td>
                </tr>
                {starters.map(p => <PlayerRow key={p.id || p.name} player={p} />)}
              </>
            )}
            {bench.length > 0 && (
              <>
                <tr>
                  <td colSpan={13} className="pt-3 pb-1.5 text-xs text-gray-600 uppercase tracking-wider font-medium">
                    Bench
                  </td>
                </tr>
                {bench.map(p => <PlayerRow key={p.id || p.name} player={p} />)}
              </>
            )}
            {dnp.length > 0 && (
              <>
                <tr>
                  <td colSpan={13} className="pt-3 pb-1.5 text-xs text-gray-600 uppercase tracking-wider font-medium">
                    Did Not Play
                  </td>
                </tr>
                {dnp.map(p => (
                  <tr key={p.id || p.name} className="border-b border-surface-2 last:border-0">
                    <td className="py-1.5 pr-4 text-gray-500">{p.name}</td>
                    <td colSpan={12} className="text-gray-600 py-1.5">DNP</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlayerRow({ player }: { player: ESPNBoxScorePlayer }) {
  const isHighPts = player.pts >= 20
  const pmPositive = player.plusMinus > 0
  const pmNegative = player.plusMinus < 0

  return (
    <tr className="border-b border-surface-2 last:border-0 hover:bg-surface-2/50 transition-colors">
      <td className="py-1.5 pr-4">
        <span className="text-white font-medium">{player.name}</span>
        {player.position && (
          <span className="text-gray-600 ml-1 text-[10px]">{player.position}</span>
        )}
      </td>
      <td className="text-right py-1.5 px-2 text-gray-500">{player.min}</td>
      <td className={cn(
        'text-right py-1.5 px-2 font-semibold',
        isHighPts ? 'text-lakers-gold' : 'text-white'
      )}>
        {player.pts}
      </td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.fg || '—'}</td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.fg3 || '—'}</td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.ft || '—'}</td>
      <td className="text-right py-1.5 px-2 text-gray-300">{player.reb}</td>
      <td className="text-right py-1.5 px-2 text-gray-300">{player.ast}</td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.to}</td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.stl}</td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.blk}</td>
      <td className="text-right py-1.5 px-2 text-gray-400">{player.pf}</td>
      <td className={cn(
        'text-right py-1.5 px-2 font-medium',
        pmPositive ? 'text-green-400' : pmNegative ? 'text-red-400' : 'text-gray-500'
      )}>
        {pmPositive ? '+' : ''}{player.plusMinus}
      </td>
    </tr>
  )
}
