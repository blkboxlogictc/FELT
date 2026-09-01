import Link from 'next/link'
import { Card } from '../ui/Card'

interface GroupCardProps {
  id: string
  name: string
  memberCount: number
}

export function GroupCard({ id, name, memberCount }: GroupCardProps) {
  return (
    <Link href={`/groups/${id}`}>
      <Card hoverable className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-slate-100 truncate">{name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="text-slate-500 text-sm shrink-0">→</span>
        </div>
      </Card>
    </Link>
  )
}
