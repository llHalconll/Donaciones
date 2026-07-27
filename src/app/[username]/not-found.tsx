import Link from 'next/link'
import { Heart, AlertCircle } from 'lucide-react'

export default function CreatorNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
        <AlertCircle className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Perfil no encontrado
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Este perfil no existe, está inactivo o no se encuentra disponible.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-slate-950 dark:focus-visible:ring-offset-slate-950"
      >
        <Heart className="size-4" aria-hidden="true" />
        Volver a la página principal
      </Link>
    </div>
  )
}
