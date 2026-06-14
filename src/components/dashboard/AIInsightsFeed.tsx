import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

type InsightItem = string | { insight: string; category?: string; priority?: string }

interface AIInsightsFeedProps {
  summary?: string
  insights: InsightItem[]
  reportDate?: string
}

export default function AIInsightsFeed({ summary, insights, reportDate }: AIInsightsFeedProps) {
  const hasData = summary || insights.length > 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lakers-gold" />
          <h3 className="section-header mb-0">AI Insights</h3>
        </div>
        {reportDate && (
          <span className="text-xs text-gray-500">
            {format(parseISO(reportDate), 'MMM d')}
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No nightly report yet</p>
          <Link href="/nightly-report" className="text-xs text-lakers-gold hover:text-lakers-gold-light mt-1 block">
            Generate report →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {summary && (
            <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
          )}
          {insights.length > 0 && (
            <div className="space-y-2 mt-3">
              {insights.slice(0, 4).map((item, i) => {
                const text = typeof item === 'string' ? item : item.insight
                const category = typeof item === 'object' ? item.category : undefined
                return (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-lakers-gold mt-0.5 flex-shrink-0">•</span>
                    <span className="text-gray-400">
                      {category && <span className="text-lakers-gold font-medium">{category}: </span>}
                      {text}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <Link href="/nightly-report" className="text-xs text-lakers-gold hover:text-lakers-gold-light block mt-2">
            View full report →
          </Link>
        </div>
      )}
    </div>
  )
}
