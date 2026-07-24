import Link from 'next/link'
import { Heart } from 'lucide-react'
import { ThemeToggle } from '../theme-toggle'
import { Button } from '../ui/button'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-emerald-500/20" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            Donaciones<span className="text-emerald-500">SaaS</span>
          </span>
        </Link>

        {/* Action Items */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Iniciar Sesión
            </Button>
          </Link>

          <Link href="/auth/register">
            <Button variant="primary" size="sm">
              Crear mi Perfil
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
