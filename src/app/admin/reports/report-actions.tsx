'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { updateReportStatusAction } from '../actions'

interface Props {
  reportId: string
}

export function AdminReportActions({ reportId }: Props) {
  const [result, setResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAction(status: 'resolved' | 'dismissed') {
    startTransition(async () => {
      const res = await updateReportStatusAction(reportId, status)
      setResult(res.success ?? res.error ?? null)
    })
  }

  if (result) {
    return (
      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">{result}</p>
    )
  }

  return (
    <div className="flex gap-2 shrink-0">
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : (
        <>
          <button
            onClick={() => handleAction('resolved')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
          </button>
          <button
            onClick={() => handleAction('dismissed')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <XCircle className="w-3.5 h-3.5" /> Descartar
          </button>
        </>
      )}
    </div>
  )
}
