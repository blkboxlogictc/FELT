'use client'

import { useRef, useState } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function DisplayNameSection({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function openEdit() {
    setDraft(name)
    setError('')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Display name is required')
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.set('display_name', trimmed)
      await updateProfile(formData)
      setName(trimmed)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between bg-surface-card border border-surface-border rounded-xl px-4 py-3">
        <p className="font-medium text-slate-100">{name}</p>
        <button
          onClick={openEdit}
          className="text-sm text-felt-light hover:text-felt transition-colors"
        >
          Edit
        </button>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Display Name">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
              Display name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setEditing(false)} fullWidth>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading} fullWidth>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
