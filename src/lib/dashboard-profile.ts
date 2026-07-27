import { cache } from 'react'
import { getAuthUser } from '@/lib/supabase/server'

export const getDashboardProfile = cache(async () => {
  const { user, supabase } = await getAuthUser()

  if (!user) {
    return { user: null, supabase, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, banner_url, plan, is_admin, is_active')
    .eq('id', user.id)
    .single()

  return { user, supabase, profile }
})
