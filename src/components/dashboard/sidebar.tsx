'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UserCircle, CreditCard, Settings,
  ExternalLink, ShieldCheck, X, Link2, BarChart2,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { LogoutButton } from './logout-button'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  username?: string
  isAdmin?: boolean
}

export function DashboardSidebar({ isOpen = false, onClose, username, isAdmin }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Mi Perfil', href: '/dashboard/profile', icon: UserCircle },
    { label: 'Redes Sociales', href: '/dashboard/social', icon: Link2 },
    { label: 'Montos de Apoyo', href: '/dashboard/buttons', icon: CreditCard },
    { label: 'Estadísticas', href: '/dashboard/analytics', icon: BarChart2 },
    { label: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú de navegación del dashboard"
      >
        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Header Brand */}
          <div className="flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Donaciones<span className="text-emerald-500">SaaS</span>
              </span>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white md:hidden"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Secciones del dashboard">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-500' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          {/* Live Profile Link */}
          {username && (
            <Link
              href={`/${username}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors group"
            >
              <span className="truncate">/{username}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
            </Link>
          )}

          {/* Admin Panel — only if is_admin */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panel Admin</span>
              <Badge variant="indigo" className="ml-auto text-[10px] px-1.5 py-0">Admin</Badge>
            </Link>
          )}

          <LogoutButton />
        </div>
      </aside>
    </>
  )
}
