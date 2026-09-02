import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GroupMembersList } from '@/components/groups/GroupMembersList'
import { InviteCodeShare } from '@/components/groups/InviteCodeShare'
import { formatDateShort } from '@/lib/utils/formatDate'

interface Props {
  params: { id: string }
}

export default async function GroupPage({ params }: Props) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: group } = await supabase.from('groups').select('*').eq('id', params.id).single()

  if (!group) notFound()

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, profile:profiles(id, display_name, avatar_url, created_at)')
    .eq('group_id', params.id)
    .order('joined_at')

  const myMembership = members?.find((m) => m.user_id === user.id)
  const isOwner = myMembership?.role === 'owner'

  const { data: games } = await supabase
    .from('games')
    .select('id, name, date, game_type, status')
    .eq('group_id', params.id)
    .order('date', { ascending: false })

  return (
    <div className="min-h-dvh bg-surface-base pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        <h1 className="font-display text-3xl font-bold text-slate-100">{group.name}</h1>

        <Link href={`/groups/${params.id}/games/new`}>
          <Button variant="primary" size="lg" fullWidth>
            + Schedule a Game
          </Button>
        </Link>

        <InviteCodeShare groupId={params.id} inviteCode={group.invite_code} isOwner={isOwner} />

        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            Members ({members?.length ?? 0})
          </h2>
          <GroupMembersList
            members={(members ?? []) as unknown as {
              user_id: string
              role: 'owner' | 'member'
              profile: { id: string; display_name: string; avatar_url: string | null; created_at: string }
            }[]}
          />
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Games</h2>
          {games && games.length > 0 ? (
            <div className="space-y-2">
              {games.map((g) => (
                <Link
                  key={g.id}
                  href={g.status === 'closed' ? `/games/${g.id}/settlement` : `/games/${g.id}`}
                >
                  <Card hoverable className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-200 truncate">{g.name}</p>
                          <Badge variant={g.game_type === 'tournament' ? 'gold' : 'neutral'} className="shrink-0">
                            {g.game_type === 'tournament' ? 'Tourney' : 'Cash'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDateShort(g.date)}</p>
                      </div>
                      <Badge
                        variant={g.status === 'active' ? 'active' : g.status === 'closed' ? 'closed' : 'default'}
                        className="shrink-0"
                      >
                        {g.status === 'active' ? '● Live' : g.status === 'closed' ? 'Closed' : 'Scheduled'}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-slate-600 py-8">
              No games yet — schedule the first one above.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
