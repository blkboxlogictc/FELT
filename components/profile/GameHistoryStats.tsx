'use client'

import { useMemo, useState } from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { ClosedGameRecord, TipRecord } from '@/lib/queries/stats'
import { formatCurrency, formatCurrencySigned } from '@/lib/utils/formatCurrency'
import { formatDateShort } from '@/lib/utils/formatDate'

type Filter = 'all' | 'cash' | 'tournament'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cash', label: 'Cash' },
  { value: 'tournament', label: 'Tournaments' },
]

interface GameHistoryStatsProps {
  records: ClosedGameRecord[]
  tipRecords: TipRecord[]
}

export function GameHistoryStats({ records, tipRecords }: GameHistoryStatsProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => r.game.game_type === filter)),
    [records, filter]
  )

  const filteredTips = useMemo(
    () => (filter === 'all' ? tipRecords : tipRecords.filter((t) => t.game.game_type === filter)),
    [tipRecords, filter]
  )

  const stats = useMemo(
    () => ({
      gamesPlayed: filtered.length,
      lifetimeNet: filtered.reduce((sum, r) => sum + r.net, 0),
      biggestWin: filtered.reduce((max, r) => Math.max(max, r.net), 0),
      biggestLoss: filtered.reduce((min, r) => Math.min(min, r.net), 0),
      tipsEarned: filteredTips.reduce((sum, t) => sum + t.amount, 0),
    }),
    [filtered, filteredTips]
  )
  const lifetimePositive = stats.lifetimeNet >= 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              'py-2 rounded-lg text-sm font-medium border transition-colors',
              filter === f.value
                ? 'bg-felt-subtle border-felt text-slate-100'
                : 'bg-surface-card border-surface-border text-slate-400 hover:border-surface-hover',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Games</p>
            <p className="text-3xl font-bold text-slate-100">{stats.gamesPlayed}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">P&amp;L</p>
            <p
              className={[
                'text-3xl font-bold font-display',
                lifetimePositive ? 'text-win' : 'text-loss',
              ].join(' ')}
            >
              {formatCurrencySigned(stats.lifetimeNet)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Best night</p>
            <p className="text-xl font-bold text-win">
              {stats.biggestWin > 0 ? `+${formatCurrency(stats.biggestWin)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Worst night</p>
            <p className="text-xl font-bold text-loss">
              {stats.biggestLoss < 0 ? formatCurrencySigned(stats.biggestLoss) : '—'}
            </p>
          </div>
        </div>

        {stats.tipsEarned > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
            <p className="text-xs text-slate-500">🎩 Tips earned dealing ({filteredTips.length} game{filteredTips.length !== 1 ? 's' : ''})</p>
            <p className="text-lg font-bold text-gold">{formatCurrency(stats.tipsEarned)}</p>
          </div>
        )}
      </Card>

      {filtered.length > 0 ? (
        <Card className="divide-y divide-surface-border">
          {filtered.map((r) => {
            const netPositive = r.net >= 0
            return (
              <div key={r.game.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200 truncate">{r.game.name}</p>
                    <Badge variant={r.game.game_type === 'tournament' ? 'gold' : 'neutral'} className="shrink-0">
                      {r.game.game_type === 'tournament' ? 'Tourney' : 'Cash'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateShort(r.game.date)} · In: {formatCurrency(r.totalBuyin)} · Out:{' '}
                    {formatCurrency(r.cashout)}
                  </p>
                </div>
                <span
                  className={['font-bold text-base shrink-0', netPositive ? 'text-win' : 'text-loss'].join(' ')}
                >
                  {formatCurrencySigned(r.net)}
                </span>
              </div>
            )
          })}
        </Card>
      ) : (
        <p className="text-center text-sm text-slate-600 py-8">
          {filter === 'all'
            ? 'No games yet — join a group and play your first one.'
            : `No ${filter} games yet.`}
        </p>
      )}
    </div>
  )
}
