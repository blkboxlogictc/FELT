'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [spinning, setSpinning] = useState(false)

  function handleRefresh() {
    setSpinning(true)
    startTransition(() => {
      router.refresh()
    })
    setTimeout(() => setSpinning(false), 600)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending || spinning}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors disabled:opacity-50"
      title="Refresh"
    >
      <span className={spinning || isPending ? 'animate-spin inline-block' : ''}>↻</span>
    </button>
  )
}
