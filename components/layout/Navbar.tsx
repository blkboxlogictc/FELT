'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/actions/profile'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/groups', label: 'Groups', icon: '◎' },
  { href: '/history', label: 'History', icon: '◷' },
  { href: '/profile', label: 'Profile', icon: '☺' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none">
            <Image src="/brand/monogram.png" alt="" width={28} height={28} className="rounded-full" priority />
            <span className="font-display text-xl font-bold text-slate-100 tracking-tight">
              Felt
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/games/new"
              className="flex items-center gap-1.5 h-8 px-3 bg-felt hover:bg-felt-light text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span className="text-base leading-none">+</span>
              <span>New Game</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors text-sm"
              title="Sign out"
            >
              ⎋
            </button>
          </div>
        </div>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-md border-t border-surface-border safe-area-inset-bottom">
        <div className="max-w-lg mx-auto grid h-16 px-2" style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                  isActive ? 'text-felt-light' : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
