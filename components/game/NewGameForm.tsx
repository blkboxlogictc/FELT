'use client'

import { useState, FormEvent } from 'react'
import { scheduleGame } from '@/lib/actions/game'
import { Button } from '../ui/Button'
import { todayISO } from '@/lib/utils/formatDate'

interface Group {
  id: string
  name: string
}

interface NewGameFormProps {
  groups: Group[]
  defaultGroupId?: string | null
}

export function NewGameForm({ groups, defaultGroupId = null }: NewGameFormProps) {
  const [groupId, setGroupId] = useState<string | null>(defaultGroupId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('group_id', groupId ?? '')
      await scheduleGame(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule game')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
          Game name
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={`Poker — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
          className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
          placeholder="Friday Night — June 20"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
          Date
        </label>
        <input
          name="date"
          type="date"
          required
          defaultValue={todayISO()}
          className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-felt transition-colors [color-scheme:dark]"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
          Group
        </label>
        <div className="bg-surface-card border border-surface-border rounded-xl divide-y divide-surface-border overflow-hidden">
          <button
            type="button"
            onClick={() => setGroupId(null)}
            className={[
              'w-full text-left px-4 py-3 transition-colors',
              groupId === null ? 'bg-felt-subtle' : 'hover:bg-surface-elevated',
            ].join(' ')}
          >
            <p className={['text-sm font-medium', groupId === null ? 'text-slate-100' : 'text-slate-300'].join(' ')}>
              Just me — no group
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              A solo session — a casino night, a home game with people not on Felt, anything you
              just want to track for yourself.
            </p>
          </button>

          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupId(g.id)}
              className={[
                'w-full text-left px-4 py-3 transition-colors',
                groupId === g.id ? 'bg-felt-subtle' : 'hover:bg-surface-elevated',
              ].join(' ')}
            >
              <p className={['text-sm font-medium', groupId === g.id ? 'text-slate-100' : 'text-slate-300'].join(' ')}>
                {g.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Group members can join and see this game.</p>
            </button>
          ))}
        </div>

        {groups.length === 0 && (
          <p className="text-xs text-slate-500 mt-2">
            You&apos;re not in any groups yet — this will be a personal game. Create or join a group
            to schedule games with others.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading}>
        Schedule Game →
      </Button>
    </form>
  )
}
