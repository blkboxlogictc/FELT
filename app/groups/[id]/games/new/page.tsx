'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { scheduleGame } from '@/lib/actions/game'
import { Button } from '@/components/ui/Button'
import { todayISO } from '@/lib/utils/formatDate'

interface Props {
  params: { id: string }
}

export default function NewGamePage({ params }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('group_id', params.id)
      await scheduleGame(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule game')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface-base pb-8">
      <header className="sticky top-0 z-40 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={`/groups/${params.id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
          >
            ←
          </Link>
          <h1 className="font-display text-lg font-semibold text-slate-100">Schedule Game</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
              Game name
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={`Friday Night — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
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

          <p className="text-xs text-slate-500">
            Group members will see this on the group page and can join in themselves.
          </p>

          {error && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Schedule Game →
          </Button>
        </form>
      </main>
    </div>
  )
}
