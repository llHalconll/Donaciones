import Link from 'next/link'
import { Heart } from 'lucide-react'
import { CookieSettingsButton } from '@/components/cookies/cookie-settings-button'

const FOOTER_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/pricing', label: 'Precios' },
  { href: '/dashboard', label: 'Mi panel' },
  { href: '/terms', label: 'Términos y Condiciones' },
  { href: '/privacy', label: 'Política de Privacidad' },
  { href: '/cookies', label: 'Política de Cookies' },
] as const

export function PublicFooter() {
  return (
    <>
      <div aria-hidden="true" className="h-48 shrink-0 sm:h-28" />
      <footer className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-slate-200 bg-slate-50 py-5 shadow-[0_-8px_30px_rgba(15,23,42,0.04)] transition-colors dark:border-slate-800/80 dark:bg-slate-950 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400 sm:px-6">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <span>© 2026 DonacionesSaaS. Todos los derechos reservados.</span>
          </div>

          <nav
            aria-label="Navegación del pie de página"
            className="flex flex-wrap items-center justify-center gap-y-2"
          >
            {FOOTER_LINKS.map((link, index) => (
              <span key={link.href} className="inline-flex items-center">
                {index > 0 && (
                  <span aria-hidden="true" className="mx-3 text-slate-300 dark:text-slate-700">
                    ·
                  </span>
                )}
                <Link
                  href={link.href}
                  className={`transition-colors hover:text-slate-900 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white ${
                    link.href === '/dashboard'
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                      : ''
                  }`}
                >
                  {link.label}
                </Link>
              </span>
            ))}
            <span className="inline-flex items-center">
              <span aria-hidden="true" className="mx-3 text-slate-300 dark:text-slate-700">
                ·
              </span>
              <CookieSettingsButton className="transition-colors hover:text-slate-900 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:text-white" />
            </span>
          </nav>
        </div>
      </footer>
    </>
  )
}
