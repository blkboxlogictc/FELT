'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { addTipGiven } from '@/lib/actions/game'
import { parseToCents } from '@/lib/utils/formatCurrency'

interface TipGivenModalProps {
  open: boolean
  onClose: () => void
  gameId: string
  dealerName: string
}

export function TipGivenModal({ open, onClose, gameId, dealerName }: TipGivenModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAmount('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  async function handleSubmit() {
    const cents = parseToCents(amount)
    if (cents <= 0) {
      setError('Enter a valid amount')
      return
    }

    setLoading(true)
    setError('')
    try {
      await addTipGiven(gameId, cents)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log a Tip">
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Optional — just for the record. This doesn&apos;t need to match {dealerName}&apos;s
          reported total.
        </p>

        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
            Amount you tipped
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
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            Log Tip
          </Button>
        </div>
      </div>
    </Modal>
  )
}
