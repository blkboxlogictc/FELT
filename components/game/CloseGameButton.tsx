'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { closeGame } from '@/lib/actions/game'

export function CloseGameButton({ gameId }: { gameId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClose() {
    setError('')
    setLoading(true)
    try {
      await closeGame(gameId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close game')
      setLoading(false)
    }
  }

  return (
    <>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button onClick={handleClose} loading={loading} variant="gold" size="lg" fullWidth>
        Close Game &amp; Settle Up
      </Button>
    </>
  )
}
