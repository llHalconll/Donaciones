'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, mounted, toggleTheme } = useTheme()

  // Render a same-size placeholder until we know the real theme.
  // This prevents the wrong icon flashing on first load AND avoids layout shift.
  if (!mounted) {
    return (
      <div
        className="size-11 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
        aria-hidden
      />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <Moon className="size-4 text-indigo-400" aria-hidden="true" />
      ) : (
        <Sun className="size-4 text-amber-500" aria-hidden="true" />
      )}
    </button>
  )
}
