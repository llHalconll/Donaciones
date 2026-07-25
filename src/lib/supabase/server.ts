import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Returns the current authenticated user, deduped per request via React.cache().
 *
 * React.cache() memoizes the result for the duration of a single server render.
 * This means layout.tsx, page.tsx, and any server component can all call
 * getAuthUser() — it will only hit Supabase Auth ONCE per request, regardless
 * of how many server components call it.
 *
 * The middleware still calls getUser() independently (required to refresh
 * session cookies) so we can't dedupe that call, but we eliminate all
 * subsequent duplicate calls within the render tree.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user: error ? null : user, supabase }
})
