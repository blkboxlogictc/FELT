'use client'

import { useEffect } from 'react'

/** Registers the service worker — required (alongside the manifest) for the app to be installable. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal — the app works fine without it, it just won't be
      // installable and repeat static-asset loads won't be cached.
    })
  }, [])

  return null
}
