'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NBA_TEAMS } from '@/lib/nba/api'
import { Sparkles } from 'lucide-react'

export default function NewScoutingReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [form, setForm] = useState({
    opponent_team_id: '',
    game_date: '',
    offensive_tendencies: '',
    defensive_tendencies: '',
    key_players: '',
    offensive_rating: '',
    defensive_rating: '',
    three_point_rate: '',
    paint_scoring_rate: '',
    transition_rate: '',
    pace_ranking: '',
  })

  async function generateAISummary() {
    if (!form.opponent_team_id || !form.offensive_tendencies) return
    setGeneratingAI(true)
    try {
      const res = await fetch('/api/insights/scouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: form.opponent_team_id,
          offensiveTendencies: form.offensive_tendencies,
          defensiveTendencies: form.defensive_tendencies,
          offensiveRating: form.offensive_rating,
          defensiveRating: form.defensive_rating,
        }),
      })
      const data = await res.json()
      if (data.summary) setAiSummary(data.summary)
    } catch {}
    setGeneratingAI(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data } = await supabase
      .from('scouting_reports')
      .insert({
        opponent_team_id: Number(form.opponent_team_id),
        game_date: form.game_date,
        offensive_tendencies: form.offensive_tendencies,
        defensive_tendencies: form.defensive_tendencies,
        key_players: form.key_players.split(',').map(s => s.trim()).filter(Boolean),
        offensive_rating: form.offensive_rating ? Number(form.offensive_rating) : null,
        defensive_rating: form.defensive_rating ? Number(form.defensive_rating) : null,
        three_point_rate: form.three_point_rate ? Number(form.three_point_rate) / 100 : null,
        paint_scoring_rate: form.paint_scoring_rate ? Number(form.paint_scoring_rate) / 100 : null,
        transition_rate: form.transition_rate ? Number(form.transition_rate) / 100 : null,
        pace_ranking: form.pace_ranking ? Number(form.pace_ranking) : null,
        ai_summary: aiSummary,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single()

    setSaving(false)
    if (data) router.push(`/scouting/${data.id}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Scouting Report</h1>
        <p className="text-sm text-gray-400 mt-0.5">Document opponent tendencies and game-plan notes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h3 className="section-header">Game Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Opponent Team</label>
              <select
                value={form.opponent_team_id}
                onChange={e => setForm(f => ({...f, opponent_team_id: e.target.value}))}
                className="input"
                required
              >
                <option value="">Select team…</option>
                {Object.entries(NBA_TEAMS).map(([id, team]) => (
                  <option key={id} value={id}>{team.city} {team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Game Date</label>
              <input
                type="date"
                value={form.game_date}
                onChange={e => setForm(f => ({...f, game_date: e.target.value}))}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="section-header">Team Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { field: 'offensive_rating', label: 'Offensive Rating', placeholder: '114.5' },
              { field: 'defensive_rating', label: 'Defensive Rating', placeholder: '108.2' },
              { field: 'pace_ranking', label: 'Pace Rank (1-30)', placeholder: '12' },
              { field: 'three_point_rate', label: '3P Rate (%)', placeholder: '38' },
              { field: 'paint_scoring_rate', label: 'Paint Rate (%)', placeholder: '52' },
              { field: 'transition_rate', label: 'Transition Rate (%)', placeholder: '15' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={(form as Record<string, string>)[field]}
                  onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
                  className="input"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="section-header">Tendencies & Notes</h3>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Offensive Tendencies</label>
            <textarea
              value={form.offensive_tendencies}
              onChange={e => setForm(f => ({...f, offensive_tendencies: e.target.value}))}
              className="input resize-none h-28"
              placeholder="Pick and roll heavy, Curry as off-ball threat, lots of movement…"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Defensive Tendencies</label>
            <textarea
              value={form.defensive_tendencies}
              onChange={e => setForm(f => ({...f, defensive_tendencies: e.target.value}))}
              className="input resize-none h-28"
              placeholder="Switch everything, aggressive on ball, zone in the halfcourt…"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Key Players to Watch (comma-separated)</label>
            <input
              value={form.key_players}
              onChange={e => setForm(f => ({...f, key_players: e.target.value}))}
              className="input"
              placeholder="Steph Curry, Draymond Green, Klay Thompson"
            />
          </div>
        </div>

        {/* AI Summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lakers-gold" />
              <h3 className="text-sm font-semibold text-white">AI Scouting Summary</h3>
            </div>
            <button
              type="button"
              onClick={generateAISummary}
              disabled={generatingAI || !form.opponent_team_id}
              className="btn-secondary text-xs py-1.5 disabled:opacity-60"
            >
              {generatingAI ? 'Generating…' : 'Generate with AI'}
            </button>
          </div>
          {aiSummary ? (
            <p className="text-sm text-gray-300 leading-relaxed">{aiSummary}</p>
          ) : (
            <p className="text-xs text-gray-500">Fill in tendencies above, then generate an AI summary.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-gold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Report'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
