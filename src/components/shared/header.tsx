import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { ThemeToggle } from '../theme-toggle'
import { buttonStyles } from '../ui/button'
import { getAuthUser } from '@/lib/supabase/server'
import { getDemoUsername } from '@/lib/public-config'
import { BrandLink } from './brand-link'

export async function PublicHeader() {
  const { user } = await getAuthUser()
  const isLoggedIn = !!user
  const demoUsername = getDemoUsername()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <BrandLink className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
          {demoUsername && (
            <Link href="/demo" className="rounded-lg px-2 py-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white">Ejemplo</Link>
          )}
          <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Precios</Link>
        </nav>

        {/* Action Items */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoggedIn ? (
            /* Authenticated: single clear CTA to the panel */
            <Link href="/dashboard" className={buttonStyles({ size: 'sm' })}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Mi panel
            </Link>
          ) : (
            /* Guest: login + register */
            <>
              <Link href="/auth/login" className={`${buttonStyles({ variant: 'ghost', size: 'sm' })} hidden sm:inline-flex`}>
                Iniciar sesión
              </Link>
              <Link href="/auth/register" className={buttonStyles({ size: 'sm' })}>
                <span className="hidden sm:inline">Crear mi perfil</span>
                <span className="sm:hidden">Crear perfil</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
