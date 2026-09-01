import { createClient } from '@supabase/supabase-js'

// Uses the service role key — only call from server-side code.
// This client bypasses Row Level Security.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
