'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { assertGameGroupMember } from '../authz'

export async function flagEntry(entryId: string, note: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: entry } = await supabase
    .from('buy_in_events')
    .select('id, game_id, user_id')
    .eq('id', entryId)
    .maybeSingle()

  if (!entry) throw new Error('Entry not found')
  if (entry.user_id === user.id) throw new Error("You can't flag your own entry")

  await assertGameGroupMember(entry.game_id)

  const { error } = await supabase.from('entry_flags').insert({
    entry_id: entry.id,
    game_id: entry.game_id,
    target_user_id: entry.user_id,
    flagged_by_user_id: user.id,
    note: note?.trim() || null,
  })

  if (error) throw new Error('Failed to flag entry — you may need to be a participant in this game')
  revalidatePath(`/games/${entry.game_id}`)
}

export async function unflagEntry(flagId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: flag } = await supabase
    .from('entry_flags')
    .select('id, game_id, flagged_by_user_id')
    .eq('id', flagId)
    .maybeSingle()

  if (!flag) throw new Error('Flag not found')
  if (flag.flagged_by_user_id !== user.id) throw new Error('Unauthorized')

  const { error } = await supabase.from('entry_flags').delete().eq('id', flagId)
  if (error) throw new Error('Failed to remove flag')
  revalidatePath(`/games/${flag.game_id}`)
}
