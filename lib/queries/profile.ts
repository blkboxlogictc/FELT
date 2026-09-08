import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Reads the current user's profile, creating it on the fly if it's missing.
 *
 * The `profiles` row is normally created by the `handle_new_user` trigger on
 * signup, but that only fires for auth.users rows inserted *after* the
 * trigger existed — any account created earlier (e.g. during initial setup,
 * or directly in the Supabase dashboard) has no matching profiles row. This
 * is the single place that gap gets healed, so every page reads a
 * consistent, always-present display name.
 */
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  user: User
): Promise<{ id: string; display_name: string }> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) return existing

  const fallbackName =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    'there'

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, display_name: fallbackName })
    .select('id, display_name')
    .single()

  if (error) {
    console.error('getOrCreateProfile insert failed:', error)
    throw new Error('Failed to set up your profile — please try again')
  }

  return created
}

/**
 * Same as getOrCreateProfile, but never throws — falls back to a locally
 * derived display name if the profile can't be read or created. Use this
 * in page renders (which have no error boundary of their own), so a
 * database hiccup degrades gracefully instead of crashing the whole page;
 * use the throwing version in mutations, where the caller already has
 * error handling (a form's try/catch) and silently degrading would just
 * hide a real problem.
 */
export async function getOrCreateProfileSafe(
  supabase: SupabaseClient,
  user: User
): Promise<{ id: string; display_name: string }> {
  try {
    return await getOrCreateProfile(supabase, user)
  } catch (err) {
    console.error('getOrCreateProfileSafe: falling back after failure', err)
    const fallbackName =
      (user.user_metadata?.display_name as string | undefined)?.trim() || user.email?.split('@')[0] || 'there'
    return { id: user.id, display_name: fallbackName }
  }
}
