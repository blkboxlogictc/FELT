'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { BuyInModal } from './BuyInModal'
import { CashOutModal } from './CashOutModal'
import { FlagEntryModal } from './FlagEntryModal'
import { TipReportModal } from './TipReportModal'
import { TipGivenModal } from './TipGivenModal'
import { undoCashOut } from '@/lib/actions/game'
import { unflagEntry } from '@/lib/actions/flag'
import { formatCurrency, formatCurrencySigned } from '@/lib/utils/formatCurrency'
import type { BuyInEvent } from '@/lib/types'

const ENTRY_LABELS: Record<BuyInEvent['type'], string> = {
  buyin: 'Buy-in',
  rebuy: 'Rebuy',
  cashout: 'Cash out',
  tip: 'Tip given',
}

interface FlagInfo {
  id: string
  note: string | null
  flaggedByName: string
  isOwnFlag: boolean
}

interface ParticipantCardProps {
  gameId: string
  displayName: string
  totalBuyin: number // cents
  cashoutAmount: number | null // cents
  isSelf: boolean
  entries: BuyInEvent[] // this participant's buyin/rebuy/tip-given events, oldest first
  flagsByEntry: Record<string, FlagInfo[]>
  isDealer: boolean
  tipsReceived: number | null // cents, the dealer's own reported total — null if not yet reported
  tipsReceivedEntryId: string | null // the buy_in_events id backing tipsReceived, for flagging
  dealerName: string | null // this game's current dealer, if any
}

export function ParticipantCard({
  gameId,
  displayName,
  totalBuyin,
  cashoutAmount,
  isSelf,
  entries,
  flagsByEntry,
  isDealer,
  tipsReceived,
  tipsReceivedEntryId,
  dealerName,
}: ParticipantCardProps) {
  const [buyInOpen, setBuyInOpen] = useState(false)
  const [cashOutOpen, setCashOutOpen] = useState(false)
  const [tipReportOpen, setTipReportOpen] = useState(false)
  const [tipGivenOpen, setTipGivenOpen] = useState(false)
  const [undoLoading, setUndoLoading] = useState(false)
  const [editingEntry, setEditingEntry] = useState<{ id: string; amount: number; type: 'buyin' | 'rebuy' } | null>(null)
  const [flaggingEntry, setFlaggingEntry] = useState<{ id: string; label: string } | null>(null)
  const [unflagLoadingId, setUnflagLoadingId] = useState<string | null>(null)

  const isCashedOut = cashoutAmount !== null
  const net = isCashedOut ? cashoutAmount - totalBuyin : -totalBuyin
  const netPositive = net >= 0
  const tipsFlags = tipsReceivedEntryId ? flagsByEntry[tipsReceivedEntryId] ?? [] : []

  async function handleUndoCashOut() {
    setUndoLoading(true)
    try {
      await undoCashOut(gameId)
    } finally {
      setUndoLoading(false)
    }
  }

  async function handleUnflag(flagId: string) {
    setUnflagLoadingId(flagId)
    try {
      await unflagEntry(flagId)
    } finally {
      setUnflagLoadingId(null)
    }
  }

  return (
    <>
      <Card className="p-4" accent={isCashedOut ? (netPositive ? 'felt' : 'none') : 'none'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-slate-100 truncate">
                {displayName}
                {isSelf && <span className="text-slate-500 font-normal"> (you)</span>}
              </span>
              {isDealer && <Badge variant="gold" className="shrink-0">Dealer</Badge>}
              {isCashedOut && <Badge variant={netPositive ? 'win' : 'loss'} className="shrink-0">✓ Out</Badge>}
            </div>

            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="text-slate-400">
                In: <span className="text-slate-200 font-medium">{formatCurrency(totalBuyin)}</span>
              </span>
              {isCashedOut && (
                <span className="text-slate-400">
                  Out: <span className="text-slate-200 font-medium">{formatCurrency(cashoutAmount)}</span>
                </span>
              )}
              {isDealer && tipsReceived !== null && (
                <span className="text-slate-400">
                  Tips: <span className="text-gold font-medium">{formatCurrency(tipsReceived)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className={['text-xl font-bold font-display', netPositive ? 'text-win' : 'text-loss'].join(' ')}>
              {isCashedOut ? formatCurrencySigned(net) : formatCurrencySigned(-totalBuyin)}
            </p>
            <p className="text-xs text-slate-500">{isCashedOut ? 'final' : 'at risk'}</p>
          </div>
        </div>

        {/* Dealer's own reported tip total — flaggable, separate from the entries log below */}
        {isDealer && tipsReceived !== null && (
          <div className="mt-3 pt-3 border-t border-surface-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Reported tips for the night</span>
              {!isSelf && tipsReceivedEntryId && (
                <button
                  type="button"
                  onClick={() =>
                    setFlaggingEntry({
                      id: tipsReceivedEntryId,
                      label: `${displayName}'s ${formatCurrency(tipsReceived)} in tips`,
                    })
                  }
                  className="text-slate-600 hover:text-red-400 transition-colors"
                  title="Flag as inaccurate"
                >
                  ⚑
                </button>
              )}
            </div>
            {tipsFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between gap-2 mt-1 pl-2 border-l-2 border-red-800/40">
                <p className="text-xs text-red-400/90">
                  ⚠ Flagged by {flag.flaggedByName}
                  {flag.note ? `: "${flag.note}"` : ''}
                </p>
                {flag.isOwnFlag && (
                  <button
                    type="button"
                    onClick={() => handleUnflag(flag.id)}
                    disabled={unflagLoadingId === flag.id}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0 disabled:opacity-50"
                  >
                    retract
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Individual buy-in / rebuy / tip-given entries */}
        {entries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-surface-border space-y-1.5">
            {entries.map((entry) => {
              const flags = flagsByEntry[entry.id] ?? []
              const isEditable = entry.type === 'buyin' || entry.type === 'rebuy'
              return (
                <div key={entry.id}>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={!isSelf || !isEditable}
                      onClick={() =>
                        isSelf &&
                        isEditable &&
                        setEditingEntry({ id: entry.id, amount: entry.amount, type: entry.type as 'buyin' | 'rebuy' })
                      }
                      className={[
                        'text-slate-400',
                        isSelf && isEditable
                          ? 'hover:text-slate-200 transition-colors underline decoration-dotted underline-offset-2'
                          : '',
                      ].join(' ')}
                    >
                      {ENTRY_LABELS[entry.type]} — {formatCurrency(entry.amount)}
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() =>
                          setFlaggingEntry({
                            id: entry.id,
                            label: `${displayName}'s ${formatCurrency(entry.amount)} ${ENTRY_LABELS[entry.type].toLowerCase()}`,
                          })
                        }
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        title="Flag as inaccurate"
                      >
                        ⚑
                      </button>
                    )}
                  </div>

                  {flags.map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between gap-2 mt-1 pl-2 border-l-2 border-red-800/40">
                      <p className="text-xs text-red-400/90">
                        ⚠ Flagged by {flag.flaggedByName}
                        {flag.note ? `: "${flag.note}"` : ''}
                      </p>
                      {flag.isOwnFlag && (
                        <button
                          type="button"
                          onClick={() => handleUnflag(flag.id)}
                          disabled={unflagLoadingId === flag.id}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0 disabled:opacity-50"
                        >
                          retract
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* Actions (self only) */}
        {isSelf && (
          <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
            {!isCashedOut ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" fullWidth onClick={() => setBuyInOpen(true)}>
                  + Buy-in / Rebuy
                </Button>
                <Button variant="primary" size="sm" fullWidth onClick={() => setCashOutOpen(true)}>
                  Cash Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCashOutOpen(true)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Edit cashout
                </button>
                <button
                  onClick={handleUndoCashOut}
                  disabled={undoLoading}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                  {undoLoading ? 'Undoing…' : 'Undo cashout'}
                </button>
              </div>
            )}

            {isDealer ? (
              <button
                onClick={() => setTipReportOpen(true)}
                className="text-xs text-gold hover:text-gold-light transition-colors"
              >
                {tipsReceived !== null ? 'Edit reported tips' : '+ Report tips received'}
              </button>
            ) : (
              dealerName && (
                <button
                  onClick={() => setTipGivenOpen(true)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  + Log a tip you gave
                </button>
              )
            )}
          </div>
        )}
      </Card>

      {isSelf && (
        <>
          <BuyInModal
            open={buyInOpen || editingEntry !== null}
            onClose={() => {
              setBuyInOpen(false)
              setEditingEntry(null)
            }}
            gameId={gameId}
            currentBuyin={totalBuyin}
            editingEntry={editingEntry}
          />

          <CashOutModal
            open={cashOutOpen}
            onClose={() => setCashOutOpen(false)}
            gameId={gameId}
            totalBuyin={totalBuyin}
            currentCashout={cashoutAmount}
          />

          {isDealer && (
            <TipReportModal
              open={tipReportOpen}
              onClose={() => setTipReportOpen(false)}
              gameId={gameId}
              currentTips={tipsReceived}
            />
          )}

          {!isDealer && dealerName && (
            <TipGivenModal
              open={tipGivenOpen}
              onClose={() => setTipGivenOpen(false)}
              gameId={gameId}
              dealerName={dealerName}
            />
          )}
        </>
      )}

      {!isSelf && flaggingEntry && (
        <FlagEntryModal
          open={flaggingEntry !== null}
          onClose={() => setFlaggingEntry(null)}
          entryId={flaggingEntry.id}
          entryLabel={flaggingEntry.label}
        />
      )}
    </>
  )
}
