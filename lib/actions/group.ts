'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../supabase/server'

function generateInviteCode(): string {
  return crypto.randomBytes(5).toString('base64url')
}

async function insertGroupWithUniqueCode(supabase: SupabaseClient, name: string, userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, invite_code: generateInviteCode(), created_by: userId })
      .select()
      .single()

    if (!error) return data
    if (!error.message?.toLowerCase().includes('duplicate')) {
      throw new Error('Failed to create group')
    }
  }
  throw new Error('Failed to create group — please try again')
}

export async function createGroup(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = (formData.get('name') as string).trim()
  if (!name) throw new Error('Group name is required')

  const group = await insertGroupWithUniqueCode(supabase, name, user.id)

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'owner' })

  if (memberError) throw new Error('Failed to add you to the group')

  redirect(`/groups/${group.id}`)
}

export async function joinGroup(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const inviteCode = (formData.get('invite_code') as string).trim()
  if (!inviteCode) throw new Error('Invite code is required')

  const { data: groups, error } = await supabase.rpc('lookup_group_by_invite_code', {
    p_code: inviteCode,
  })

  if (error || !groups || groups.length === 0) throw new Error('Invalid invite code')
  const group = groups[0] as { id: string; name: string }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' })

  if (memberError && !memberError.message?.toLowerCase().includes('duplicate')) {
    throw new Error('Failed to join group')
  }

  redirect(`/groups/${group.id}`)
}

export async function leaveGroup(groupId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to leave group')
  redirect('/')
}

export async function regenerateInviteCode(groupId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.role !== 'owner') {
    throw new Error('Only the group owner can regenerate the invite code')
  }

  const newCode = generateInviteCode()
  const { error } = await supabase
    .from('groups')
    .update({ invite_code: newCode })
    .eq('id', groupId)

  if (error) throw new Error('Failed to regenerate invite code')
  revalidatePath(`/groups/${groupId}`)
  return { invite_code: newCode }
}
