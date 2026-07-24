import Link from 'next/link'
import { Heart, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
          Este usuario no existe o aún no ha activado su perfil público.
        </p>
      </div>

      <Link href="/">
        <Button variant="primary" size="sm">
          <Heart className="w-4 h-4" />
          Volver a la página principal
        </Button>
      </Link>
    </div>
  )
}
