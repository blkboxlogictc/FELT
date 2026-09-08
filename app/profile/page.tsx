import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getLifetimeStats, getTipsEarned } from '@/lib/queries/stats'
import { getOrCreateProfileSafe } from '@/lib/queries/profile'
import { Navbar } from '@/components/layout/Navbar'
import { DisplayNameSection } from '@/components/profile/DisplayNameSection'
import { GameHistoryStats } from '@/components/profile/GameHistoryStats'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = createClient()

  const profile = await getOrCreateProfileSafe(supabase, user)
  const { records } = await getLifetimeStats(supabase, user.id)
  const tipRecords = await getTipsEarned(supabase, user.id)

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
          <GameHistoryStats records={records} tipRecords={tipRecords} />
        </section>
      </main>
    </div>
  )
}
