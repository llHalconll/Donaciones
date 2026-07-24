'use client'

import { Menu, User, Bell } from 'lucide-react'
import { ThemeToggle } from '../theme-toggle'

interface DashboardHeaderProps {
  onOpenMobileMenu?: () => void
}

export function DashboardHeader({ onOpenMobileMenu }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
          Panel de Creador
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications Icon Placeholder */}
        <button
          type="button"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-xs">
            <p className="font-semibold text-slate-900 dark:text-white">Alex Creator</p>
            <p className="text-slate-400 font-mono">@demo</p>
          </div>
        </div>
      </div>
    </header>
  )
}
