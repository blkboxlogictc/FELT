import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getLifetimeStats } from '@/lib/queries/stats'
import { getOrCreateProfile } from '@/lib/queries/profile'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { DisplayNameSection } from '@/components/profile/DisplayNameSection'
import { formatCurrency, formatCurrencySigned } from '@/lib/utils/formatCurrency'
import { formatDateShort } from '@/lib/utils/formatDate'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = createClient()

  const profile = await getOrCreateProfile(supabase, user)

  const { stats, records: closedRecords } = await getLifetimeStats(supabase, user.id)
  const lifetimePositive = stats.lifetime_net >= 0

  return (
    <div className="min-h-dvh bg-surface-base pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        <h1 className="font-display text-3xl font-bold text-slate-100">Profile</h1>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Display Name</h2>
          <DisplayNameSection currentName={profile.display_name} />
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            Lifetime Stats — All Groups
          </h2>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Games</p>
                <p className="text-3xl font-bold text-slate-100">{stats.games_played}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">All-time P&amp;L</p>
                <p
                  className={[
                    'text-3xl font-bold font-display',
                    lifetimePositive ? 'text-win' : 'text-loss',
                  ].join(' ')}
                >
                  {formatCurrencySigned(stats.lifetime_net)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Best night</p>
                <p className="text-xl font-bold text-win">
                  {stats.biggest_win > 0 ? `+${formatCurrency(stats.biggest_win)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Worst night</p>
                <p className="text-xl font-bold text-loss">
                  {stats.biggest_loss < 0 ? formatCurrencySigned(stats.biggest_loss) : '—'}
                </p>
              </div>
            </div>
          </Card>
        </section>

        {closedRecords.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Game History</h2>
            <Card className="divide-y divide-surface-border">
              {closedRecords.map((r) => {
                const netPositive = r.net >= 0
                return (
                  <div key={r.game.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{r.game.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDateShort(r.game.date)} · In: {formatCurrency(r.totalBuyin)} · Out:{' '}
                        {formatCurrency(r.cashout)}
                      </p>
                    </div>
                    <span
                      className={['font-bold text-base', netPositive ? 'text-win' : 'text-loss'].join(' ')}
                    >
                      {formatCurrencySigned(r.net)}
                    </span>
                  </div>
                )
              })}
            </Card>
          </section>
        )}

        {closedRecords.length === 0 && (
          <p className="text-center text-sm text-slate-600 py-8">
            No games yet — join a group and play your first one.
          </p>
        )}
      </main>
    </div>
  )
}
