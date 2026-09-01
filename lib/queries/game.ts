import type { SupabaseClient } from '@supabase/supabase-js'
import type { GameParticipant } from '../types'

/**
 * Merges the `game_participants` table (roster + profile join) with the
 * `game_participant_totals` view (computed buy-in sums) — a plain Postgres
 * view has no FK for PostgREST to embed a profile join through, so the two
 * are fetched separately and merged here.
 */
export async function getGameParticipants(
  supabase: SupabaseClient,
  gameId: string
): Promise<GameParticipant[]> {
  const [{ data: participants, error: participantsError }, { data: totals, error: totalsError }] =
    await Promise.all([
      supabase
        .from('game_participants')
        .select('id, game_id, user_id, cashout_amount, joined_at, profile:profiles(id, display_name, avatar_url, created_at)')
        .eq('game_id', gameId)
        .order('joined_at'),
      supabase
        .from('game_participant_totals')
        .select('user_id, total_buyin')
        .eq('game_id', gameId),
    ])

  if (participantsError) throw new Error('Failed to load participants')
  if (totalsError) throw new Error('Failed to load buy-in totals')

  const totalsMap = new Map((totals ?? []).map((t) => [t.user_id, t.total_buyin as number]))

  return (participants ?? []).map((p) => ({
    ...p,
    total_buyin: totalsMap.get(p.user_id) ?? 0,
  })) as unknown as GameParticipant[]
}
