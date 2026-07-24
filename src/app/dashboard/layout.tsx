import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, is_active')
    .eq('id', user.id)
    .single()

  return (
    <DashboardLayoutClient
      username={profile?.username ?? ''}
      isAdmin={profile?.is_admin ?? false}
    >
      {children}
    </DashboardLayoutClient>
  )
}
