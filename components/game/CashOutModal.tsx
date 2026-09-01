'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { cashOut } from '@/lib/actions/game'
import { parseToCents, formatCurrency, formatCurrencySigned } from '@/lib/utils/formatCurrency'

interface CashOutModalProps {
  open: boolean
  onClose: () => void
  gameId: string
  totalBuyin: number // cents
  currentCashout?: number | null // cents, if editing an existing cashout
}

export function CashOutModal({ open, onClose, gameId, totalBuyin, currentCashout = null }: CashOutModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAmount(currentCashout !== null ? String(currentCashout / 100) : '')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const previewCents = parseToCents(amount)
  const previewNet = amount ? previewCents - totalBuyin : null
  const isPositive = previewNet !== null && previewNet >= 0

  async function handleSubmit() {
    const cents = parseToCents(amount)
    if (cents < 0) {
      setError('Enter a valid chip count')
      return
    }

    setLoading(true)
    setError('')
    try {
      await cashOut(gameId, cents)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cash Out">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-slate-400 uppercase tracking-wider">
              Final chip count
            </label>
            <span className="text-xs text-slate-500">
              Bought in: <span className="text-slate-300">{formatCurrency(totalBuyin)}</span>
            </span>
          </div>
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

        {previewNet !== null && (
          <div
            className={[
              'rounded-xl p-3 text-center',
              isPositive ? 'bg-green-950/40 border border-green-800/30' : 'bg-red-950/40 border border-red-800/30',
            ].join(' ')}
          >
            <p className="text-xs text-slate-400 mb-0.5">Tonight&apos;s result</p>
            <p
              className={[
                'text-2xl font-bold font-display',
                isPositive ? 'text-win' : 'text-loss',
              ].join(' ')}
            >
              {formatCurrencySigned(previewNet)}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            Cash Out
          </Button>
        </div>
      </div>
    </Modal>
  )
}
