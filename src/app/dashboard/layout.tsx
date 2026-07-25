import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // getAuthUser() is memoized via React.cache() — calling it here and in
  // page.tsx costs only ONE network round-trip to Supabase Auth.
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/auth/login')

  // Fetch ALL profile columns needed by both layout (sidebar/header)
  // AND dashboard/page.tsx in a single query.
  // page.tsx will call getAuthUser() again — free (cached) — and can
  // re-use this profile data via the same supabase client.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, banner_url, plan, is_admin, is_active')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutClient
      username={profile?.username ?? ''}
      displayName={profile?.display_name ?? ''}
      avatarUrl={profile?.avatar_url ?? null}
      isAdmin={profile?.is_admin ?? false}
    >
      {children}
    </DashboardLayoutClient>
  )
}
