import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default async function NewGroupPage() {
  await requireAuth()

  return (
    <div className="min-h-dvh bg-surface-base pb-8">
      <header className="sticky top-0 z-40 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/groups"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
          >
            ←
          </Link>
          <h1 className="font-display text-lg font-semibold text-slate-100">New Group</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        <CreateGroupForm />
      </main>
    </div>
  )
}
