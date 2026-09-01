import { getUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getLifetimeStats } from '@/lib/queries/stats'
import { getOrCreateProfile } from '@/lib/queries/profile'
import { Navbar } from '@/components/layout/Navbar'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  const user = await getUser()
  if (!user) return <LandingPage />

  const supabase = createClient()

  const profile = await getOrCreateProfile(supabase, user)

  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, group_members(count)')
    .order('created_at', { ascending: false })

  const groups = (groupRows ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    memberCount: (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  // RLS scopes this to games in groups I'm a member of, plus my own personal
  // (group-less) games — no manual group filtering needed.
  const { data: games } = await supabase
    .from('games')
    .select('id, name, date, status, group:groups(id, name)')
    .in('status', ['scheduled', 'active'])
    .order('date', { ascending: true })

  const upcomingGames = (games ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    date: g.date as string,
    status: g.status as 'scheduled' | 'active',
    groupName: (g.group as unknown as { name: string } | null)?.name ?? null,
  }))

  const { stats } = await getLifetimeStats(supabase, user.id)

  return (
    <div className="min-h-dvh bg-surface-base pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-5">
        <Dashboard
          displayName={profile.display_name}
          groups={groups}
          upcomingGames={upcomingGames}
          stats={stats}
        />
      </main>
    </div>
  )
}
