import { ReactNode } from 'react'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
