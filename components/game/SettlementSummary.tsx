'use client'

import { useState } from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { Settlement, PlayerResult } from '@/lib/settlement'
import { formatCurrency, formatCurrencySigned } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'

interface SettlementSummaryProps {
  sessionName: string
  sessionDate: string
  players: PlayerResult[]
  settlement: Settlement
}

export function SettlementSummary({
  sessionName,
  sessionDate,
  players,
  settlement,
}: SettlementSummaryProps) {
  const [copied, setCopied] = useState(false)

  const sorted = [...players].sort((a, b) => b.net - a.net)
  const winner = sorted[0]
  const loser = sorted[sorted.length - 1]
  const hasWinner = winner && winner.net > 0
  const hasLoser = loser && loser.net < 0

  function buildShareText(): string {
    const lines: string[] = [
      `♠ Felt — ${sessionName}`,
      `${formatDate(sessionDate)}`,
      '',
      'Results:',
      '─────────────────────',
    ]

    sorted.forEach((p) => {
      const emoji = p.net >= 0 ? '🟢' : '🔴'
      lines.push(`${emoji} ${p.name}: ${formatCurrencySigned(p.net)}`)
    })

    lines.push('─────────────────────', '', 'Settlements:')

    if (settlement.mode === 'peer_to_peer') {
      if (settlement.transactions.length === 0) {
        lines.push('Everyone breaks even!')
      } else {
        settlement.transactions.forEach((t) => {
          lines.push(`• ${t.from} → ${t.to}: ${formatCurrency(t.amount)}`)
        })
      }
    } else {
      if (settlement.payHost.length === 0 && settlement.hostPays.length === 0) {
        lines.push('Everyone breaks even!')
      }
      settlement.payHost.forEach((t) => {
        lines.push(`• ${t.from} pays host: ${formatCurrency(t.amount)}`)
      })
      settlement.hostPays.forEach((t) => {
        lines.push(`• Host pays ${t.to}: ${formatCurrency(t.amount)}`)
      })
    }

    if (hasWinner) {
      lines.push(`\n🏆 Big winner: ${winner.name} (${formatCurrencySigned(winner.net)})`)
    }
    if (hasLoser) {
      lines.push(`💀 Biggest loss: ${loser.name} (${formatCurrencySigned(loser.net)})`)
    }

    return lines.join('\n')
  }

  async function handleShare() {
    const text = buildShareText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for mobile browsers that block clipboard without gesture
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="space-y-4">
      {/* Per-player results */}
      <div className="space-y-2">
        {sorted.map((p, i) => {
          const isWinner = i === 0 && hasWinner
          const isLoser = i === sorted.length - 1 && hasLoser
          const netPositive = p.net >= 0

          return (
            <Card key={p.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 truncate">{p.name}</span>
                    {isWinner && (
                      <Badge variant="gold" className="shrink-0">
                        🏆 Winner
                      </Badge>
                    )}
                    {isLoser && p.net < 0 && (
                      <Badge variant="loss" className="shrink-0">
                        💀
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Bought in {formatCurrency(p.totalBuyin)} · Cashed {formatCurrency(p.cashoutAmount)}
                  </p>
                </div>

                <span
                  className={[
                    'text-xl font-bold font-display shrink-0',
                    netPositive ? 'text-win' : 'text-loss',
                  ].join(' ')}
                >
                  {formatCurrencySigned(p.net)}
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Settlement instructions */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 px-1">
          {settlement.mode === 'peer_to_peer' ? 'Settlements' : 'Central Bank Settlements'}
        </h3>

        <Card className="divide-y divide-surface-border">
          {settlement.mode === 'peer_to_peer' ? (
            settlement.transactions.length === 0 ? (
              <div className="px-4 py-4 text-center text-slate-400 text-sm">
                Everyone breaks even — no transfers needed ✓
              </div>
            ) : (
              settlement.transactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="text-sm">
                    <span className="text-slate-200 font-medium">{t.from}</span>
                    <span className="text-slate-500 mx-2">→</span>
                    <span className="text-slate-200 font-medium">{t.to}</span>
                  </div>
                  <span className="font-semibold text-gold">{formatCurrency(t.amount)}</span>
                </div>
              ))
            )
          ) : (
            <>
              {settlement.payHost.length > 0 && (
                <div>
                  <p className="px-4 pt-3 text-xs text-slate-500 uppercase tracking-wider">
                    Pay the host
                  </p>
                  {settlement.payHost.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-slate-200 font-medium">{t.from}</span>
                      <span className="font-semibold text-loss">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {settlement.hostPays.length > 0 && (
                <div>
                  <p className="px-4 pt-3 text-xs text-slate-500 uppercase tracking-wider">
                    Host pays out
                  </p>
                  {settlement.hostPays.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-slate-200 font-medium">{t.to}</span>
                      <span className="font-semibold text-win">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {settlement.payHost.length === 0 && settlement.hostPays.length === 0 && (
                <div className="px-4 py-4 text-center text-slate-400 text-sm">
                  Everyone breaks even — no transfers needed ✓
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Share button */}
      <Button onClick={handleShare} variant="secondary" size="lg" fullWidth>
        {copied ? '✓ Copied to clipboard' : '↑ Copy recap for group chat'}
      </Button>
    </div>
  )
}
