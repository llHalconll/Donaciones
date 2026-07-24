import Link from 'next/link'
import { Heart } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
          <span>© 2026 DonacionesSaaS. Todos los derechos reservados.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Inicio
          </Link>
          <Link href="/demo" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Demo
          </Link>
          <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Precios
          </Link>
          <Link href="/auth/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Registro
          </Link>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Términos
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacidad
          </Link>
        </div>
      </div>
    </footer>
  )
}
