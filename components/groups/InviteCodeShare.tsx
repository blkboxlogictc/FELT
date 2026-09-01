'use client'

import { useState } from 'react'
import { regenerateInviteCode } from '@/lib/actions/group'
import { Button } from '../ui/Button'

interface InviteCodeShareProps {
  groupId: string
  inviteCode: string
  isOwner: boolean
}

export function InviteCodeShare({ groupId, inviteCode, isOwner }: InviteCodeShareProps) {
  const [code, setCode] = useState(inviteCode)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be blocked — silently ignore, code is still visible
    }
  }

  async function handleRegenerate() {
    setLoading(true)
    try {
      const result = await regenerateInviteCode(groupId)
      if (result?.invite_code) setCode(result.invite_code)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Invite code</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-100 tracking-widest text-center">
          {code}
        </code>
        <Button variant="secondary" size="md" onClick={handleCopy}>
          {copied ? '✓' : 'Copy'}
        </Button>
      </div>
      {isOwner && (
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? 'Regenerating…' : 'Regenerate code'}
        </button>
      )}
    </div>
  )
}
