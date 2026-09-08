'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { reportTips } from '@/lib/actions/game'
import { parseToCents } from '@/lib/utils/formatCurrency'

interface TipReportModalProps {
  open: boolean
  onClose: () => void
  gameId: string
  currentTips?: number | null // cents, if editing an already-reported total
}

export function TipReportModal({ open, onClose, gameId, currentTips = null }: TipReportModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAmount(currentTips !== null ? String(currentTips / 100) : '')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSubmit() {
    const cents = parseToCents(amount)
    if (cents < 0) {
      setError('Enter a valid amount')
      return
    }

    setLoading(true)
    setError('')
    try {
      await reportTips(gameId, cents)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Report Tips">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
            Total tips received tonight
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium select-none">
              $
            </span>
            <input
              ref={inputRef}
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              placeholder="0"
              min="0"
              step="1"
              className="w-full bg-surface-elevated border border-surface-border rounded-xl pl-8 pr-4 py-3 text-2xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <p className="text-xs text-slate-500 mt-2">
            One running total for the night — report again to update it. Visible to the group and
            flaggable if it looks off.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
