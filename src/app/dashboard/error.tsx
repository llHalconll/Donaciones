'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring service in production
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-rose-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Algo salió mal</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Ocurrió un error al cargar esta página. Por favor intenta de nuevo.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-400 font-mono">ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4" />
        Intentar de nuevo
      </Button>
    </div>
  )
}
