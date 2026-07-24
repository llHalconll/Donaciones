import Link from 'next/link'
import { Heart } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
            <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
            DonacionesSaaS
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 DonacionesSaaS</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-200">Términos</Link>
            <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-200">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
