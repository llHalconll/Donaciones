'use client'

import { useState, ReactNode } from 'react'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'

interface Props {
  children: ReactNode
  username: string
  displayName: string
  avatarUrl: string | null
  isAdmin: boolean
}

export function DashboardLayoutClient({ children, username, displayName, avatarUrl, isAdmin }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <DashboardSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        username={username}
        isAdmin={isAdmin}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          displayName={displayName}
          username={username}
          avatarUrl={avatarUrl}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
