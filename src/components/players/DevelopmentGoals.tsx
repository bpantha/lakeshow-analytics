'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, Plus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Goal {
  id: string
  title: string
  description: string
  target_value: number
  current_value: number
  baseline_value: number
  unit: string
  deadline: string
  status: 'active' | 'achieved' | 'paused'
}

interface Props {
  goals: Goal[]
  playerId: string
  playerName: string
  canEdit: boolean
}

function ProgressBar({ current, baseline, target }: { current: number; baseline: number; target: number }) {
  const range = target - baseline
  const progress = range > 0 ? Math.min(((current - baseline) / range) * 100, 100) : 0
  return (
    <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2">
      <div
        className={cn('h-1.5 rounded-full transition-all', progress >= 100 ? 'bg-green-400' : 'bg-lakers-gold')}
        style={{ width: `${Math.max(progress, 2)}%` }}
      />
    </div>
  )
}

export default function DevelopmentGoals({ goals: initialGoals, playerId, playerName, canEdit }: Props) {
  const [goals, setGoals] = useState(initialGoals)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', target_value: '', current_value: '', baseline_value: '', unit: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase
      .from('development_goals')
      .insert({
        player_id: playerId,
        title: form.title,
        description: form.description,
        target_value: Number(form.target_value),
        current_value: Number(form.current_value),
        baseline_value: Number(form.baseline_value),
        unit: form.unit,
        deadline: form.deadline,
        status: 'active',
      })
      .select()
      .single()

    if (data) {
      setGoals(prev => [data as Goal, ...prev])
      setShowAdd(false)
      setForm({ title: '', description: '', target_value: '', current_value: '', baseline_value: '', unit: '', deadline: '' })
    }
    setSaving(false)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-lakers-gold" />
          <h3 className="text-sm font-semibold text-white">Development Goals</h3>
        </div>
        {canEdit && (
          <button onClick={() => setShowAdd(!showAdd)} className="btn-secondary text-xs py-1.5 px-3">
            <Plus className="w-3 h-3" />
            Add Goal
          </button>
        )}
      </div>

      {showAdd && canEdit && (
        <form onSubmit={addGoal} className="bg-surface-2 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Goal Title</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="input" placeholder="e.g. Improve 3-point shooting" required />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input" placeholder="Details about this goal..." />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Baseline</label>
              <input type="number" step="0.1" value={form.baseline_value} onChange={e => setForm(f => ({...f, baseline_value: e.target.value}))} className="input" placeholder="Starting value" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Current</label>
              <input type="number" step="0.1" value={form.current_value} onChange={e => setForm(f => ({...f, current_value: e.target.value}))} className="input" placeholder="Current value" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Target</label>
              <input type="number" step="0.1" value={form.target_value} onChange={e => setForm(f => ({...f, target_value: e.target.value}))} className="input" placeholder="Target value" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Unit</label>
              <input value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} className="input" placeholder="e.g. %, PPG" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-gold text-xs py-1.5 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Goal'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-xs py-1.5">
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-gray-500 text-sm">{canEdit ? 'No development goals set. Add one above.' : 'No goals set yet.'}</p>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const pct = goal.target_value > goal.baseline_value
              ? Math.min(((goal.current_value - goal.baseline_value) / (goal.target_value - goal.baseline_value)) * 100, 100)
              : 0
            return (
              <div key={goal.id} className="bg-surface-2 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{goal.title}</p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded',
                        goal.status === 'achieved' ? 'bg-green-900/40 text-green-400' :
                        goal.status === 'paused' ? 'bg-surface-3 text-gray-400' :
                        'bg-lakers-purple/20 text-purple-300'
                      )}>
                        {goal.status}
                      </span>
                    </div>
                    {goal.description && <p className="text-xs text-gray-400 mt-0.5">{goal.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-lakers-gold">
                      {goal.current_value}{goal.unit}
                    </p>
                    <p className="text-xs text-gray-500">of {goal.target_value}{goal.unit}</p>
                  </div>
                </div>
                <ProgressBar current={goal.current_value} baseline={goal.baseline_value} target={goal.target_value} />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-500">
                    Baseline: {goal.baseline_value}{goal.unit} → Target: {goal.target_value}{goal.unit}
                  </p>
                  <p className={cn('text-xs font-medium flex items-center gap-1', pct >= 100 ? 'text-green-400' : 'text-lakers-gold')}>
                    <TrendingUp className="w-3 h-3" />
                    {pct.toFixed(0)}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
