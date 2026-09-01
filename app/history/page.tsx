import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatCurrencySigned } from '@/lib/utils/formatCurrency'
import { formatDateShort } from '@/lib/utils/formatDate'

export default async function HistoryPage() {
  const user = await requireAuth()
  const supabase = createClient()

  // RLS scopes this to closed games in groups I'm a member of, plus my own
  // personal (group-less) games — no manual group filtering needed.
  const { data: gamesData } = await supabase
    .from('games')
    .select('id, name, date, group_id')
    .eq('status', 'closed')
    .order('date', { ascending: false })
  const games = gamesData ?? []

  const gameIds = games.map((g) => g.id)

  const totals =
    gameIds.length > 0
      ? (
          await supabase
            .from('game_participant_totals')
            .select('game_id, user_id, total_buyin, cashout_amount')
            .in('game_id', gameIds)
        ).data ?? []
      : []

  const userIds = Array.from(new Set(totals.map((t) => t.user_id)))
  const profiles =
    userIds.length > 0
      ? (await supabase.from('profiles').select('id, display_name').in('id', userIds)).data ?? []
      : []
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name as string]))

  const totalsByGame = new Map<string, typeof totals>()
  totals.forEach((t) => {
    const list = totalsByGame.get(t.game_id) ?? []
    list.push(t)
    totalsByGame.set(t.game_id, list)
  })

  const totalVolume = totals.reduce((sum, t) => sum + t.total_buyin, 0)

  const playerNetMap: Record<string, { name: string; net: number; games: number }> = {}
  totals.forEach((t) => {
    const name = profileMap.get(t.user_id) ?? 'Unknown'
    if (!playerNetMap[t.user_id]) playerNetMap[t.user_id] = { name, net: 0, games: 0 }
    playerNetMap[t.user_id].net += (t.cashout_amount ?? 0) - t.total_buyin
    playerNetMap[t.user_id].games += 1
  })
  const playerNets = Object.values(playerNetMap)
  const mostProfitable = playerNets.length ? playerNets.reduce((a, b) => (a.net > b.net ? a : b)) : null

  return (
    <div className="min-h-dvh bg-surface-base pb-24">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        <h1 className="font-display text-3xl font-bold text-slate-100">History</h1>
        <p className="text-sm text-slate-500 -mt-4">Every closed game across your groups</p>

        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Games</p>
            <p className="text-2xl font-bold text-slate-100">{games.length}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Volume</p>
            <p className="text-xl font-bold text-felt-light">{formatCurrency(totalVolume)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Top player</p>
            <p className="text-sm font-semibold text-gold truncate">
              {mostProfitable ? mostProfitable.name : '—'}
            </p>
          </Card>
        </div>

        {playerNets.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Leaderboard</h2>
            <Card className="divide-y divide-surface-border">
              {[...playerNets]
                .sort((a, b) => b.net - a.net)
                .map((p, i) => (
                  <div key={p.name + i} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm font-bold text-slate-500 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.games} games</p>
                    </div>
                    <span className={['font-bold text-base', p.net >= 0 ? 'text-win' : 'text-loss'].join(' ')}>
                      {formatCurrencySigned(p.net)}
                    </span>
                  </div>
                ))}
            </Card>
          </section>
        )}

        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">All Games</h2>

          {games.length === 0 ? (
            <p className="text-center text-sm text-slate-600 py-8">No closed games yet.</p>
          ) : (
            <div className="space-y-3">
              {games.map((game) => {
                const rows = totalsByGame.get(game.id) ?? []
                const volume = rows.reduce((sum, r) => sum + r.total_buyin, 0)

                return (
                  <Link key={game.id} href={`/games/${game.id}/settlement`}>
                    <Card hoverable className="overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 truncate">{game.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDateShort(game.date)} · {rows.length} players · {formatCurrency(volume)} volume
                          </p>
                        </div>
                        <span className="text-slate-500 text-sm ml-2">→</span>
                      </div>

                      <div className="divide-y divide-surface-border">
                        {[...rows]
                          .sort((a, b) => ((b.cashout_amount ?? 0) - b.total_buyin) - ((a.cashout_amount ?? 0) - a.total_buyin))
                          .map((r) => {
                            const net = (r.cashout_amount ?? 0) - r.total_buyin
                            return (
                              <div key={r.user_id} className="flex items-center justify-between px-4 py-2">
                                <span className="text-sm text-slate-300">
                                  {profileMap.get(r.user_id) ?? 'Unknown'}
                                </span>
                                <span className={['text-sm font-semibold', net >= 0 ? 'text-win' : 'text-loss'].join(' ')}>
                                  {formatCurrencySigned(net)}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
