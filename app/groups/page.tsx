import Image from 'next/image'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { GroupCard } from '@/components/groups/GroupCard'
import { Button } from '@/components/ui/Button'

export default async function GroupsPage() {
  await requireAuth()
  const supabase = createClient()

  // RLS already scopes this to groups the current user belongs to
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, created_at, group_members(count)')
    .order('created_at', { ascending: false })

  const rows = (groups ?? []).map((g) => ({
    id: g.id as string,
    name: g.name as string,
    memberCount: (g.group_members as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return (
    <div className="min-h-dvh bg-surface-base pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-slate-100">Groups</h1>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/groups/new">
            <Button variant="secondary" fullWidth>
              + Create
            </Button>
          </Link>
          <Link href="/groups/join">
            <Button variant="secondary" fullWidth>
              Join
            </Button>
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 text-center">
            <Image src="/brand/icon-flat.png" alt="" width={1254} height={1254} className="w-12 h-auto mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-1">No groups yet</p>
            <p className="text-sm text-slate-500">
              Create a group for your regular game, or join one with an invite code.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((g) => (
              <GroupCard key={g.id} id={g.id} name={g.name} memberCount={g.memberCount} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
