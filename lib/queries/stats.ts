import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlayerStats } from '../types'

export interface ClosedGameRecord {
  game: { id: string; name: string; date: string }
  totalBuyin: number
  cashout: number
  net: number
}

/** Lifetime stats for a user across every closed game in every group they're in. */
export async function getLifetimeStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{ stats: PlayerStats; records: ClosedGameRecord[] }> {
  const { data: totals } = await supabase
    .from('game_participant_totals')
    .select('game_id, total_buyin, cashout_amount')
    .eq('user_id', userId)

  const gameIds = (totals ?? []).map((t) => t.game_id)

  const games =
    gameIds.length > 0
      ? (
          await supabase
            .from('games')
            .select('id, name, date, status')
            .in('id', gameIds)
            .eq('status', 'closed')
            .order('date', { ascending: false })
        ).data ?? []
      : []

  const totalsMap = new Map((totals ?? []).map((t) => [t.game_id, t]))

  const records: ClosedGameRecord[] = games.map((g) => {
    const t = totalsMap.get(g.id)!
    const cashout = t.cashout_amount ?? 0
    return { game: g, totalBuyin: t.total_buyin, cashout, net: cashout - t.total_buyin }
  })

  const stats: PlayerStats = {
    games_played: records.length,
    lifetime_net: records.reduce((sum, r) => sum + r.net, 0),
    biggest_win: records.reduce((max, r) => Math.max(max, r.net), 0),
    biggest_loss: records.reduce((min, r) => Math.min(min, r.net), 0),
  }

  return { stats, records }
}
