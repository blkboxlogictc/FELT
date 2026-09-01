'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'

export async function signUp(formData: FormData) {
  const supabase = createClient()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const displayName = (formData.get('display_name') as string).trim()

  if (!displayName) return { error: 'Display name is required' }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    },
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Failed to create account' }

  return { error: null, needsConfirmation: !data.session }
}

export async function signIn(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const displayName = (formData.get('display_name') as string).trim()
  if (!displayName) throw new Error('Display name is required')

  // Upsert rather than update: some accounts predate the profiles-on-signup
  // trigger and have no row yet, so a plain update would silently affect zero rows.
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName }, { onConflict: 'id' })

  if (error) throw new Error('Failed to update profile')
  revalidatePath('/profile')
  revalidatePath('/')
}
