'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'felt-install-prompt-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem(DISMISS_KEY) === 'true') return

    if (isIOS()) {
      setShowIOSHint(true)
      setVisible(true)
      return
    }

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setVisible(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (choice.outcome === 'accepted') dismiss()
    else setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-surface-card border border-felt/30 rounded-xl p-4 flex items-start gap-3">
      <Image
        src="/brand/monogram.png"
        alt=""
        width={40}
        height={40}
        className="rounded-lg shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100">Install Felt</p>
        {showIOSHint ? (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Tap <span className="text-slate-200 font-medium">Share</span> then{' '}
            <span className="text-slate-200 font-medium">Add to Home Screen</span> for the full
            app experience.
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5">Add it to your home screen for quick access.</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {!showIOSHint && (
          <button
            onClick={handleInstall}
            className="text-xs font-semibold text-felt-light hover:text-felt transition-colors"
          >
            Install
          </button>
        )}
        <button onClick={dismiss} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  )
}
