'use client'

import { useState, FormEvent } from 'react'
import { createGroup } from '@/lib/actions/group'
import { Button } from '../ui/Button'

export function CreateGroupForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createGroup(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
          Group name
        </label>
        <input
          name="name"
          type="text"
          required
          autoFocus
          className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
          placeholder="Friday Night Regulars"
        />
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth loading={loading}>
        Create Group
      </Button>
    </form>
  )
}
