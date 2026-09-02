import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getGameParticipants } from '@/lib/queries/game'
import { SettlementSummary } from '@/components/game/SettlementSummary'
import { Badge } from '@/components/ui/Badge'
import { buildPlayerResults, calculateSettlement } from '@/lib/settlement'
import { formatDate } from '@/lib/utils/formatDate'

interface Props {
  params: { id: string }
}

export default async function SettlementPage({ params }: Props) {
  const supabase = createClient()

  const { data: game } = await supabase.from('games').select('*').eq('id', params.id).single()
  if (!game) notFound()

  const participants = await getGameParticipants(supabase, params.id)
  const playerResults = buildPlayerResults(
    participants.map((p) => ({
      user_id: p.user_id,
      total_buyin: p.total_buyin,
      cashout_amount: p.cashout_amount,
      profile: { display_name: p.profile?.display_name ?? 'Unknown' },
    }))
  )
  const settlement = calculateSettlement(playerResults, game.settlement_mode)

  return (
    <div className="min-h-dvh bg-surface-base pb-8">
      <header className="sticky top-0 z-40 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={game.group_id ? `/groups/${game.group_id}` : '/'}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors shrink-0"
            >
              ←
            </Link>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-slate-100 truncate leading-tight">{game.name}</h1>
              <p className="text-xs text-slate-500 leading-tight">{formatDate(game.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={game.game_type === 'tournament' ? 'gold' : 'neutral'}>
              {game.game_type === 'tournament' ? 'Tourney' : 'Cash'}
            </Badge>
            {!game.group_id && <Badge variant="neutral">Solo</Badge>}
            <Badge variant="closed">Closed</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-1">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-bold text-slate-100">Settlement</h2>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">
            {game.settlement_mode.replace('_', '-')} mode
          </p>
        </div>

        <SettlementSummary
          sessionName={game.name}
          sessionDate={game.date}
          players={playerResults}
          settlement={settlement}
        />
      </main>
    </div>
  )
}
