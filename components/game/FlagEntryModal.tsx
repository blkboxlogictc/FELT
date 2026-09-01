'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { flagEntry } from '@/lib/actions/flag'

interface FlagEntryModalProps {
  open: boolean
  onClose: () => void
  entryId: string
  entryLabel: string // e.g. "Marcus's $60 rebuy"
}

export function FlagEntryModal({ open, onClose, entryId, entryLabel }: FlagEntryModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setNote('')
      setError('')
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      await flagEntry(entryId, note)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Flag Entry">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Flag <span className="text-slate-200 font-medium">{entryLabel}</span> as inaccurate.
          This is visible to the group but doesn&apos;t change the number — only{' '}
          {entryLabel.split("'")[0]} can fix it.
        </p>

        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
            Note (optional)
          </label>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. I saw them buy in for $40, not $60"
            className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors resize-none"
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading} fullWidth>
            Flag Entry
          </Button>
        </div>
      </div>
    </Modal>
  )
}
