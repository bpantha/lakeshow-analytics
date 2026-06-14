'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, Lock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Note {
  id: string
  author_id: string
  author_name: string
  content: string
  is_private: boolean
  created_at: string
}

interface Props {
  notes: Note[]
  subjectId: string
  subjectType: 'player' | 'game' | 'opponent'
  authorId: string
  authorName: string
  userRole: string
}

export default function CoachNotes({ notes: initialNotes, subjectId, subjectType, authorId, authorName, userRole }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)

    const { data } = await supabase
      .from('coach_notes')
      .insert({
        author_id: authorId,
        author_name: authorName,
        subject_id: subjectId,
        subject_type: subjectType,
        content: content.trim(),
        is_private: isPrivate,
      })
      .select()
      .single()

    if (data) {
      setNotes(prev => [data as Note, ...prev])
      setContent('')
      setIsPrivate(false)
    }
    setSaving(false)
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-4 h-4 text-lakers-gold" />
        <h3 className="text-sm font-semibold text-white">Coach Notes</h3>
        <span className="text-xs text-gray-500">({notes.length})</span>
      </div>

      {/* Add note */}
      <form onSubmit={addNote} className="mb-5">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="input resize-none h-24"
          placeholder="Add a note about this player…"
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            <Lock className="w-3 h-3" />
            Private (only visible to you)
          </label>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="btn-primary text-xs py-1.5 disabled:opacity-60"
          >
            <Plus className="w-3 h-3" />
            {saving ? 'Adding…' : 'Add Note'}
          </button>
        </div>
      </form>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-gray-500 text-sm">No notes yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-surface-2 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-lakers-purple/40 flex items-center justify-center text-xs font-bold text-lakers-gold">
                    {note.author_name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <span className="text-xs font-medium text-gray-300">{note.author_name}</span>
                  {note.is_private && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Lock className="w-2.5 h-2.5" /> Private
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {format(parseISO(note.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
