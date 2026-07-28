import Link from 'next/link'
import { Heart } from 'lucide-react'
import { getDemoUsername } from '@/lib/public-config'

export function PublicFooter() {
  const demoUsername = getDemoUsername()

  return (
    <>
      <div aria-hidden="true" className="h-48 shrink-0 sm:h-28" />
      <footer className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-slate-200 bg-slate-50 py-6 shadow-[0_-8px_30px_rgba(15,23,42,0.04)] transition-colors dark:border-slate-800/80 dark:bg-slate-950 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <span>© 2026 DonacionesSaaS. Todos los derechos reservados.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
            {demoUsername && (
              <Link href="/demo" className="hover:text-slate-900 dark:hover:text-white transition-colors">Ejemplo</Link>
            )}
            <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Precios</Link>

            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-emerald-600 dark:text-emerald-400">
              Mi panel
            </Link>

            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Términos y Condiciones</Link>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Política de Privacidad</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
