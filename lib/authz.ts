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
    .select('id, group_id, status, created_by, dealer_user_id, dealer_request_user_id')
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

/**
 * Throws unless the current user manages the given game's dealer
 * assignment: the group's owner, or — for a personal/solo game — its
 * creator (there's no group owner to defer to).
 */
export async function assertCanManageDealer(gameId: string) {
  const { user, game } = await assertGameGroupMember(gameId)

  if (!game.group_id) {
    if (game.created_by !== user.id) throw new Error('Unauthorized: not your game')
    return { user, game }
  }

  const supabase = createClient()
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', game.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'owner') {
    throw new Error('Only the group owner can manage the dealer')
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
