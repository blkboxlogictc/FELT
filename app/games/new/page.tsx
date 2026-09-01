import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NewGameForm } from '@/components/game/NewGameForm'

export default async function NewGamePage() {
  await requireAuth()
  const supabase = createClient()

  const { data: groups } = await supabase.from('groups').select('id, name').order('name')

  return (
    <div className="min-h-dvh bg-surface-base pb-8">
      <header className="sticky top-0 z-40 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
          >
            ←
          </Link>
          <h1 className="font-display text-lg font-semibold text-slate-100">New Game</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5">
        <NewGameForm groups={groups ?? []} />
      </main>
    </div>
  )
}
