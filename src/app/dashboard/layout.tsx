import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getDashboardProfile } from '@/lib/dashboard-profile'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getDashboardProfile()
  if (!user) redirect('/auth/login')

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
