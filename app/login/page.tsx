'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from '@/lib/actions/profile'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-dvh bg-surface-base flex flex-col items-center justify-center p-4">
      {/* Background suit watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[20rem] text-white/[0.02] font-bold leading-none">♠</span>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/brand/lockup.png"
            alt="Felt — Everyone's Table"
            width={1448}
            height={1086}
            className="mx-auto w-[240px] h-auto"
            priority
          />
        </div>

        {/* Login card */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl">
          <h2 className="font-display text-xl font-semibold text-slate-100 mb-5">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-felt hover:bg-felt-light active:bg-felt-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            New to Felt?{' '}
            <Link href="/signup" className="text-felt-light hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Gold accent line */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-surface-border" />
          <span className="text-gold/40 text-sm">♦ ♦ ♦</span>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
      </div>
    </div>
  )
}
