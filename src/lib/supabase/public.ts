import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client that always uses the anonymous role.
 *
 * Public pages and anonymous APIs must not inherit an authenticated visitor's
 * session. This lets profile RLS distinguish public reads from owner/admin
 * reads without exposing private profile columns to every signed-in user.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }
  )
}
