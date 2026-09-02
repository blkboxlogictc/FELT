'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'
import { assertGroupMember, assertGameGroupMember, assertOwnEntry } from '../authz'
import { getGameParticipants } from '../queries/game'

export async function scheduleGame(formData: FormData) {
  const groupIdRaw = formData.get('group_id') as string | null
  const groupId = groupIdRaw && groupIdRaw.trim() !== '' ? groupIdRaw : null
  const name = (formData.get('name') as string).trim()
  const date = formData.get('date') as string
  const gameType = formData.get('game_type') === 'tournament' ? 'tournament' : 'cash'

  if (!name || !date) throw new Error('Name and date are required')

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (groupId) await assertGroupMember(groupId)

  const { data: game, error } = await supabase
    .from('games')
    .insert({
      group_id: groupId,
      name,
      date,
      game_type: gameType,
      status: 'scheduled',
      settlement_mode: 'peer_to_peer',
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !game) throw new Error('Failed to schedule game')

  // Personal (group-less) games auto-join their creator — there's no one
  // else to RSVP, so there's no reason to wait.
  if (!groupId) {
    await supabase.from('game_participants').insert({ game_id: game.id, user_id: user.id })
  }

  redirect(`/games/${game.id}`)
}

export async function joinGame(gameId: string) {
  const { user } = await assertGameGroupMember(gameId)
  const supabase = createClient()

  const { error } = await supabase
    .from('game_participants')
    .insert({ game_id: gameId, user_id: user.id })

  if (error && !error.message?.toLowerCase().includes('duplicate')) {
    throw new Error('Failed to join game')
  }

  revalidatePath(`/games/${gameId}`)
}

export async function leaveGame(gameId: string) {
  const { user, game } = await assertGameGroupMember(gameId)
  if (game.status !== 'scheduled') {
    throw new Error('Cannot leave a game that has already started')
  }
  const supabase = createClient()

  const { error } = await supabase
    .from('game_participants')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to leave game')
  revalidatePath(`/games/${gameId}`)
}

export async function addBuyIn(gameId: string, amountCents: number) {
  if (amountCents <= 0) throw new Error('Enter a valid amount')
  const { user, game } = await assertGameGroupMember(gameId)
  const supabase = createClient()

  // Auto-join on a walk-up buy-in for someone who never formally RSVP'd
  const { error: joinError } = await supabase
    .from('game_participants')
    .insert({ game_id: gameId, user_id: user.id })

  if (joinError && !joinError.message?.toLowerCase().includes('duplicate')) {
    throw new Error('Failed to join game')
  }

  const { count } = await supabase
    .from('buy_in_events')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .in('type', ['buyin', 'rebuy'])

  const { error: eventError } = await supabase.from('buy_in_events').insert({
    game_id: gameId,
    user_id: user.id,
    type: count && count > 0 ? 'rebuy' : 'buyin',
    amount: amountCents,
  })

  if (eventError) throw new Error('Failed to record buy-in')

  if (game.status === 'scheduled') {
    await supabase.from('games').update({ status: 'active' }).eq('id', gameId)
  }

  revalidatePath(`/games/${gameId}`)
}

export async function cashOut(gameId: string, amountCents: number) {
  if (amountCents < 0) throw new Error('Enter a valid chip count')
  const { user } = await assertGameGroupMember(gameId)
  const supabase = createClient()

  const { error: updateError } = await supabase
    .from('game_participants')
    .update({ cashout_amount: amountCents })
    .eq('game_id', gameId)
    .eq('user_id', user.id)

  if (updateError) throw new Error('Failed to update cashout')

  // Keep a single canonical cashout event per participant per game
  await supabase
    .from('buy_in_events')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .eq('type', 'cashout')

  const { error: eventError } = await supabase.from('buy_in_events').insert({
    game_id: gameId,
    user_id: user.id,
    type: 'cashout',
    amount: amountCents,
  })

  if (eventError) throw new Error('Failed to record cashout')

  revalidatePath(`/games/${gameId}`)
}

export async function undoCashOut(gameId: string) {
  const { user } = await assertGameGroupMember(gameId)
  const supabase = createClient()

  const { error: updateError } = await supabase
    .from('game_participants')
    .update({ cashout_amount: null })
    .eq('game_id', gameId)
    .eq('user_id', user.id)

  if (updateError) throw new Error('Failed to undo cashout')

  await supabase
    .from('buy_in_events')
    .delete()
    .eq('game_id', gameId)
    .eq('user_id', user.id)
    .eq('type', 'cashout')

  revalidatePath(`/games/${gameId}`)
}

export async function editBuyInEvent(eventId: string, newAmountCents: number) {
  if (newAmountCents <= 0) throw new Error('Enter a valid amount')
  const { entry } = await assertOwnEntry(eventId)
  if (entry.type === 'cashout') {
    throw new Error('Use cash-out to update your final chip count')
  }
  const supabase = createClient()

  const { error } = await supabase
    .from('buy_in_events')
    .update({ amount: newAmountCents })
    .eq('id', eventId)

  if (error) throw new Error('Failed to update entry')
  revalidatePath(`/games/${entry.game_id}`)
}

export async function deleteBuyInEvent(eventId: string) {
  const { entry } = await assertOwnEntry(eventId)
  if (entry.type === 'cashout') {
    throw new Error('Use "Undo cashout" to remove your cashout')
  }
  const supabase = createClient()

  const { error } = await supabase.from('buy_in_events').delete().eq('id', eventId)
  if (error) throw new Error('Failed to delete entry')
  revalidatePath(`/games/${entry.game_id}`)
}

export async function closeGame(gameId: string) {
  await assertGameGroupMember(gameId)
  const supabase = createClient()

  const participants = await getGameParticipants(supabase, gameId)
  const stillPlaying = participants.filter((p) => p.total_buyin > 0 && p.cashout_amount === null)

  if (stillPlaying.length > 0) {
    throw new Error('Not all players have cashed out')
  }

  const { error } = await supabase.from('games').update({ status: 'closed' }).eq('id', gameId)
  if (error) throw new Error('Failed to close game')

  revalidatePath(`/games/${gameId}`)
  redirect(`/games/${gameId}/settlement`)
}
