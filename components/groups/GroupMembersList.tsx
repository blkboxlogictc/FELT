import type { Profile } from '@/lib/types'

interface Member {
  user_id: string
  role: 'owner' | 'member'
  profile: Profile
}

export function GroupMembersList({ members }: { members: Member[] }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl divide-y divide-surface-border">
      {members.map((m) => (
        <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-felt-subtle border border-felt/30 flex items-center justify-center text-sm font-bold text-felt-light uppercase shrink-0">
            {m.profile.display_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 truncate">{m.profile.display_name}</p>
          </div>
          {m.role === 'owner' && (
            <span className="text-xs text-gold uppercase tracking-wider shrink-0">Owner</span>
          )}
        </div>
      ))}
    </div>
  )
}
