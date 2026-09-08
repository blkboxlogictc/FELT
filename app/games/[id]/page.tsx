import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getGameParticipants } from '@/lib/queries/game'
import { joinGame } from '@/lib/actions/game'
import { ParticipantCard } from '@/components/game/ParticipantCard'
import { DealerSection } from '@/components/game/DealerSection'
import { CloseGameButton } from '@/components/game/CloseGameButton'
import { RefreshButton } from '@/components/game/RefreshButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import type { BuyInEvent } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function GamePage({ params }: Props) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: game } = await supabase.from('games').select('*').eq('id', params.id).single()
  if (!game) notFound()
  if (game.status === 'closed') redirect(`/games/${params.id}/settlement`)

  const participants = await getGameParticipants(supabase, params.id)
  const isParticipant = participants.some((p) => p.user_id === user.id)

  const { data: events } = await supabase
    .from('buy_in_events')
    .select('*')
    .eq('game_id', params.id)
    .in('type', ['buyin', 'rebuy', 'tip'])
    .order('created_at')

  const { data: flags } = await supabase.from('entry_flags').select('*').eq('game_id', params.id)

  const profileMap = new Map(participants.map((p) => [p.user_id, p.profile?.display_name ?? 'Unknown']))

  let isManager = false
  if (!game.group_id) {
    isManager = game.created_by === user.id
  } else {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', game.group_id)
      .eq('user_id', user.id)
      .maybeSingle()
    isManager = membership?.role === 'owner'
  }

  // The dealer's own reported tip total is pulled out into its own summary —
  // everything else (buyin/rebuy, and anyone else's optional "tip given" log)
  // renders in the normal per-participant entries list.
  let dealerTipsReceived: number | null = null
  let dealerTipsEntryId: string | null = null

  const eventsByUser = new Map<string, BuyInEvent[]>()
  ;(events ?? []).forEach((e) => {
    if (e.type === 'tip' && game.dealer_user_id && e.user_id === game.dealer_user_id) {
      dealerTipsReceived = e.amount
      dealerTipsEntryId = e.id
      return
    }
    const list = eventsByUser.get(e.user_id) ?? []
    list.push(e as BuyInEvent)
    eventsByUser.set(e.user_id, list)
  })

  const dealerName = game.dealer_user_id ? profileMap.get(game.dealer_user_id) ?? 'Unknown' : null
  const pendingRequestName = game.dealer_request_user_id
    ? profileMap.get(game.dealer_request_user_id) ?? 'Unknown'
    : null

  const flagsByEntry: Record<
    string,
    { id: string; note: string | null; flaggedByName: string; isOwnFlag: boolean }[]
  > = {}
  ;(flags ?? []).forEach((f) => {
    const list = flagsByEntry[f.entry_id] ?? []
    list.push({
      id: f.id,
      note: f.note,
      flaggedByName: profileMap.get(f.flagged_by_user_id) ?? 'Someone',
      isOwnFlag: f.flagged_by_user_id === user.id,
    })
    flagsByEntry[f.entry_id] = list
  })

  const activePlayers = participants.filter((p) => p.total_buyin > 0)
  const allCashedOut = activePlayers.length > 0 && activePlayers.every((p) => p.cashout_amount !== null)
  const stillPlayingCount = activePlayers.filter((p) => p.cashout_amount === null).length

  const totalBoughtIn = participants.reduce((sum, p) => sum + p.total_buyin, 0)
  const totalCashedOut = participants.reduce((sum, p) => sum + (p.cashout_amount ?? 0), 0)
  const totalInPlay = totalBoughtIn - totalCashedOut

  async function handleJoin() {
    'use server'
    await joinGame(params.id)
  }

  return (
    <div className="min-h-dvh bg-surface-base pb-24">
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
            <Badge variant={game.status === 'active' ? 'active' : 'default'}>
              {game.status === 'active' ? '● Live' : 'Scheduled'}
            </Badge>
            <RefreshButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Total in</p>
              <p className="text-xl font-bold text-slate-200">{formatCurrency(totalBoughtIn)}</p>
            </div>
            <div className="text-center border-x border-surface-border">
              <p className="text-xs text-slate-500 mb-1">In play</p>
              <p className="text-2xl font-bold text-felt-light">{formatCurrency(totalInPlay)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Players</p>
              <p className="text-xl font-bold text-slate-400">{participants.length}</p>
            </div>
          </div>
        </div>

        {!isParticipant && (
          <form action={handleJoin}>
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Join this game
            </Button>
          </form>
        )}

        <DealerSection
          gameId={params.id}
          currentUserId={user.id}
          participants={participants.map((p) => ({ id: p.user_id, name: p.profile?.display_name ?? 'Unknown' }))}
          dealerId={game.dealer_user_id}
          dealerName={dealerName}
          pendingRequestId={game.dealer_request_user_id}
          pendingRequestName={pendingRequestName}
          isManager={isManager}
          canRequestDealer={!!game.group_id && isParticipant && game.dealer_user_id !== user.id}
        />

        <div className="space-y-2">
          {participants.map((p) => (
            <ParticipantCard
              key={p.user_id}
              gameId={params.id}
              displayName={p.profile?.display_name ?? 'Unknown'}
              totalBuyin={p.total_buyin}
              cashoutAmount={p.cashout_amount}
              isSelf={p.user_id === user.id}
              entries={eventsByUser.get(p.user_id) ?? []}
              flagsByEntry={flagsByEntry}
              isDealer={!!game.dealer_user_id && p.user_id === game.dealer_user_id}
              tipsReceived={p.user_id === game.dealer_user_id ? dealerTipsReceived : null}
              tipsReceivedEntryId={p.user_id === game.dealer_user_id ? dealerTipsEntryId : null}
              dealerName={dealerName}
            />
          ))}
        </div>

        {participants.length === 0 && (
          <p className="text-center text-sm text-slate-600 py-8">No one has joined yet.</p>
        )}

        {isParticipant && allCashedOut && (
          <div className="bg-gold-subtle border border-gold/30 rounded-xl p-4 space-y-3">
            <div>
              <p className="font-semibold text-gold text-sm mb-0.5">All players cashed out</p>
              <p className="text-xs text-slate-400">
                Ready to close the game and calculate settlements.
              </p>
            </div>
            <CloseGameButton gameId={params.id} />
          </div>
        )}

        {!allCashedOut && stillPlayingCount > 0 && (
          <p className="text-center text-xs text-slate-600 py-2">
            {stillPlayingCount} player{stillPlayingCount !== 1 ? 's' : ''} still at the table
          </p>
        )}
      </main>
    </div>
  )
}
