import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { InstallPrompt } from '../pwa/InstallPrompt'

const features = [
  {
    icon: '✦',
    title: 'Your stats',
    body: 'Every buy-in and cashout you log builds your lifetime record — wins, losses, and everything in between.',
  },
  {
    icon: '✎',
    title: 'Self-reported, peer-checked',
    body: "You enter your own buy-ins and cashout. Anyone at the table can flag a number that looks off.",
  },
  {
    icon: '◎',
    title: 'Groups',
    body: 'Join your regular crew to schedule games together and see the group\'s shared history.',
  },
  {
    icon: '♠',
    title: 'Instant settlement',
    body: 'Fewest possible transactions to settle up, calculated the moment the game closes.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface-base relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[24rem] text-white/[0.02] font-bold leading-none">♠</span>
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-16 pb-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <Image
            src="/brand/lockup.png"
            alt="Felt — Everyone's Table"
            width={1448}
            height={1086}
            className="mx-auto w-[280px] h-auto mb-4"
            priority
          />
          <p className="text-slate-300 text-lg font-medium mb-2">Your poker record, finally in one place.</p>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Log your own buy-ins and cashouts and watch your lifetime stats build automatically.
            Join a group with your regular crew to schedule games together and settle up when the
            night's over.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Image
            src="/brand/chips.png"
            alt=""
            width={1254}
            height={1254}
            className="w-[130px] h-auto opacity-90"
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mb-12">
          <Link href="/signup">
            <Button variant="primary" size="lg" fullWidth>
              Create free account
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg" fullWidth>
              Sign in
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <InstallPrompt />
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <Card key={f.title} className="p-4">
              <span className="text-2xl">{f.icon}</span>
              <p className="font-semibold text-slate-100 text-sm mt-2 mb-1">{f.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{f.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-surface-border" />
          <span className="text-gold/40 text-sm">♦ ♦ ♦</span>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
      </div>
    </div>
  )
}
