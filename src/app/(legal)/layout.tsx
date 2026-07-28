import Link from 'next/link'
import { BrandLink } from '@/components/shared/brand-link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LegalRoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#legal-main-content"
        className="sr-only z-[60] rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido jurídico
      </a>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLink size="sm" />
          <nav
            aria-label="Navegación legal principal"
            className="ml-auto hidden items-center gap-1 sm:flex"
          >
            <Link
              href="/terms"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Términos y Condiciones
            </Link>
            <Link
              href="/privacy"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Política de Privacidad
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="legal-main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </div>
  )
}
