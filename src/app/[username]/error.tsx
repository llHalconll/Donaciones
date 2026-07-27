'use client'

import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
  reset: () => void
}

export default function PublicProfileError({ reset }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
        <AlertCircle className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold">No pudimos cargar este perfil</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Ocurrió un problema temporal. Intenta nuevamente en unos segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-slate-950 dark:focus-visible:ring-offset-slate-950"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Intentar de nuevo
      </button>
    </main>
  )
}
