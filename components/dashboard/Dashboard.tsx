import Image from 'next/image'
import Link from 'next/link'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { PlayerStats } from '@/lib/types'
import { formatCurrencySigned } from '@/lib/utils/formatCurrency'
import { formatDateShort } from '@/lib/utils/formatDate'

interface UpcomingGame {
  id: string
  name: string
  date: string
  status: 'scheduled' | 'active'
  groupName: string | null // null = personal/solo game
}

interface GroupSummary {
  id: string
  name: string
  memberCount: number
}

interface DashboardProps {
  displayName: string
  groups: GroupSummary[]
  upcomingGames: UpcomingGame[]
  stats: PlayerStats
}

export function Dashboard({ displayName, groups, upcomingGames, stats }: DashboardProps) {
  const lifetimePositive = stats.lifetime_net >= 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-400 text-sm">Welcome back,</p>
        <h1 className="font-display text-3xl font-bold text-slate-100">{displayName}</h1>
      </div>

      {/* Lifetime stats teaser */}
      <Link href="/profile">
        <Card hoverable className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Lifetime P&amp;L · {stats.games_played} games</p>
              <p className={['text-2xl font-bold font-display', lifetimePositive ? 'text-win' : 'text-loss'].join(' ')}>
                {formatCurrencySigned(stats.lifetime_net)}
              </p>
            </div>
            <span className="text-slate-500 text-sm">View profile →</span>
          </div>
        </Card>
      </Link>

      {/* Upcoming / active games */}
      <section>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Games</h2>
        {upcomingGames.length === 0 ? (
          <Card className="p-6 text-center">
            <Image src="/brand/icon-flat.png" alt="" width={1254} height={1254} className="w-12 h-auto mx-auto mb-3" />
            <p className="text-slate-300 font-medium mb-1">No games on the calendar</p>
            <p className="text-sm text-slate-500">Tap &quot;New Game&quot; above to log one.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingGames.map((g) => (
              <Link key={g.id} href={`/games/${g.id}`}>
                <Card hoverable className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200 truncate">{g.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {g.groupName ?? 'Solo'} · {formatDateShort(g.date)}
                      </p>
                    </div>
                    <Badge variant={g.status === 'active' ? 'active' : 'default'} className="shrink-0">
                      {g.status === 'active' ? '● Live' : 'Scheduled'}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Groups */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-wider text-slate-400">Your Groups</h2>
          <Link href="/groups" className="text-xs text-felt-light hover:text-felt transition-colors">
            View all →
          </Link>
        </div>

        {groups.length === 0 ? (
          <Card className="p-6 text-center space-y-3">
            <p className="text-slate-300 font-medium">No groups yet</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/groups/new">
                <Button variant="secondary" fullWidth size="sm">
                  + Create
                </Button>
              </Link>
              <Link href="/groups/join">
                <Button variant="secondary" fullWidth size="sm">
                  Join
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <Card hoverable className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-200">{g.name}</p>
                    <span className="text-xs text-slate-500">
                      {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
