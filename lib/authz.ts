import { createClient } from './supabase/server'

/** Throws unless the current user belongs to the given group. */
export async function assertGroupMember(groupId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) throw new Error('Unauthorized: not a member of this group')
  return user
}

/**
 * Throws unless the current user can access the given game: a member of its
 * group, or — for a personal/solo game (group_id IS NULL) — its creator.
 */
export async function assertGameGroupMember(gameId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: game } = await supabase
    .from('games')
    .select('id, group_id, status, created_by')
    .eq('id', gameId)
    .maybeSingle()

  if (!game) throw new Error('Game not found')

  if (game.group_id) {
    await assertGroupMember(game.group_id)
  } else if (game.created_by !== user.id) {
    throw new Error('Unauthorized: not your game')
  }

  return { user, game }
}

/** Throws unless the given buy_in_events row belongs to the current user. */
export async function assertOwnEntry(entryId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: entry } = await supabase
    .from('buy_in_events')
    .select('*')
    .eq('id', entryId)
    .maybeSingle()

  if (!entry) throw new Error('Entry not found')
  if (entry.user_id !== user.id) throw new Error('Unauthorized: not your entry')
  return { user, entry }
}
