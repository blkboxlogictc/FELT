'use client'

import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { setDealer, requestDealer, approveDealerRequest, denyDealerRequest } from '@/lib/actions/game'

interface Participant {
  id: string
  name: string
}

interface DealerSectionProps {
  gameId: string
  currentUserId: string
  participants: Participant[]
  dealerId: string | null
  dealerName: string | null
  pendingRequestId: string | null
  pendingRequestName: string | null
  isManager: boolean // group owner, or the solo creator of a personal game
  canRequestDealer: boolean // a group game, viewer has joined, and isn't already the dealer
}

export function DealerSection({
  gameId,
  currentUserId,
  participants,
  dealerId,
  dealerName,
  pendingRequestId,
  pendingRequestName,
  isManager,
  canRequestDealer,
}: DealerSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleSetDealer(id: string | null) {
    setLoadingId(id ?? 'clear')
    try {
      await setDealer(gameId, id)
      setPickerOpen(false)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleRequest() {
    setLoadingId('request')
    try {
      await requestDealer(gameId)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleApprove() {
    setLoadingId('approve')
    try {
      await approveDealerRequest(gameId)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDeny() {
    setLoadingId('deny')
    try {
      await denyDealerRequest(gameId)
    } finally {
      setLoadingId(null)
    }
  }

  const isRequesting = pendingRequestId === currentUserId

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Dealer</p>
            <p className="text-sm font-medium text-slate-200 truncate">{dealerName ?? 'No dealer set'}</p>
          </div>

          {isManager ? (
            <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)} className="shrink-0">
              {dealerName ? 'Change' : 'Set Dealer'}
            </Button>
          ) : (
            canRequestDealer && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRequest}
                disabled={isRequesting || loadingId === 'request'}
                className="shrink-0"
              >
                {isRequesting ? 'Request pending…' : 'Request to Deal'}
              </Button>
            )
          )}
        </div>

        {isManager && pendingRequestId && (
          <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between gap-3">
            <p className="text-sm text-slate-300 min-w-0 truncate">
              <span className="font-medium">{pendingRequestName}</span> wants to deal
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDeny}
                disabled={loadingId === 'deny'}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
              >
                Deny
              </button>
              <Button variant="primary" size="sm" onClick={handleApprove} loading={loadingId === 'approve'}>
                Approve
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Set Dealer">
        <div className="space-y-2">
          <button
            onClick={() => handleSetDealer(null)}
            disabled={loadingId !== null}
            className={[
              'w-full text-left px-4 py-3 rounded-xl border transition-colors disabled:opacity-50',
              dealerId === null
                ? 'bg-felt-subtle border-felt text-slate-100'
                : 'bg-surface-card border-surface-border text-slate-400 hover:border-surface-hover',
            ].join(' ')}
          >
            No dealer
          </button>
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSetDealer(p.id)}
              disabled={loadingId !== null}
              className={[
                'w-full text-left px-4 py-3 rounded-xl border transition-colors disabled:opacity-50',
                dealerId === p.id
                  ? 'bg-felt-subtle border-felt text-slate-100'
                  : 'bg-surface-card border-surface-border text-slate-400 hover:border-surface-hover',
              ].join(' ')}
            >
              {p.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
