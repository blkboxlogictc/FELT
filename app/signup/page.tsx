'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signUp } from '@/lib/actions/profile'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result?.needsConfirmation) {
      setConfirmSent(true)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-surface-base flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[20rem] text-white/[0.02] font-bold leading-none">♠</span>
      </div>

      <div className="relative w-full max-w-sm">
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

        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-2xl">
          {confirmSent ? (
            <div className="text-center py-2">
              <p className="text-2xl mb-3">✉️</p>
              <p className="text-slate-200 font-medium mb-1">Check your email</p>
              <p className="text-sm text-slate-500">
                We sent a confirmation link — follow it to activate your account, then sign in.
              </p>
              <Link
                href="/login"
                className="inline-block mt-5 text-felt-light text-sm hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-slate-100 mb-5">
                Create your account
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">
                    Display name
                  </label>
                  <input
                    name="display_name"
                    type="text"
                    required
                    autoComplete="name"
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-felt transition-colors"
                    placeholder="Alex"
                  />
                </div>

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
                    minLength={6}
                    autoComplete="new-password"
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
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5">
                Already have an account?{' '}
                <Link href="/login" className="text-felt-light hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
