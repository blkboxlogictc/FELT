'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { addBuyIn, editBuyInEvent, deleteBuyInEvent } from '@/lib/actions/game'
import { parseToCents, formatCurrency } from '@/lib/utils/formatCurrency'

interface EditingEntry {
  id: string
  amount: number // cents
  type: 'buyin' | 'rebuy'
}

interface BuyInModalProps {
  open: boolean
  onClose: () => void
  gameId: string
  currentBuyin: number // cents
  editingEntry?: EditingEntry | null
}

export function BuyInModal({ open, onClose, gameId, currentBuyin, editingEntry = null }: BuyInModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setAmount(editingEntry ? String(editingEntry.amount / 100) : '')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (editingEntry) {
        await editBuyInEvent(editingEntry.id, cents)
      } else {
        await addBuyIn(gameId, cents)
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editingEntry) return
    setDeleting(true)
    setError('')
    try {
      await deleteBuyInEvent(editingEntry.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  const title = editingEntry
    ? `Edit ${editingEntry.type === 'buyin' ? 'buy-in' : 'rebuy'}`
    : currentBuyin > 0
    ? 'Rebuy'
    : 'Buy-in'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {!editingEntry && currentBuyin > 0 && (
        <p className="text-sm text-slate-400 mb-4">
          You&apos;re currently in for{' '}
          <span className="text-slate-200 font-medium">{formatCurrency(currentBuyin)}</span>
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
            Amount
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

        {!editingEntry && (
          <div className="grid grid-cols-4 gap-2">
            {[20, 40, 60, 100].map((val) => (
              <button
                key={val}
                onClick={() => {
                  setAmount(String(val))
                  setError('')
                }}
                className="py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-surface-border text-sm text-slate-300 transition-colors"
              >
                ${val}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} fullWidth>
            Confirm
          </Button>
        </div>

        {editingEntry && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full text-center text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 pt-1"
          >
            {deleting ? 'Deleting…' : 'Delete this entry'}
          </button>
        )}
      </div>
    </Modal>
  )
}
