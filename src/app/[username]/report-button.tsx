'use client'

import { useState } from 'react'
import { Flag, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const REASONS = [
  { value: 'fraud', label: 'Fraude o estafa' },
  { value: 'impersonation', label: 'Suplantación de identidad' },
  { value: 'prohibited_content', label: 'Contenido prohibido' },
  { value: 'suspicious_link', label: 'Enlace sospechoso' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Otro' },
] as const

interface Props {
  profileId: string
  profileName: string
}

export function ReportButton({ profileId, profileName }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          reason: fd.get('reason'),
          description: fd.get('description') ?? '',
          reporter_email: fd.get('reporter_email') ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) setResult({ error: data.error ?? 'Error al enviar el reporte.' })
      else setResult({ success: 'Reporte enviado. Gracias por ayudar a mantener la plataforma segura.' })
    } catch {
      setResult({ error: 'Error de conexión. Intenta nuevamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-colors"
        aria-label={`Reportar perfil de ${profileName}`}
      >
        <Flag className="w-3.5 h-3.5" />
        Reportar
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Reportar perfil"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Reportar perfil</h2>
          <button
            onClick={() => { setOpen(false); setResult(null) }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {result?.success ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{result.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {result?.error && (
              <div role="alert" className="flex items-center gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5" /> {result.error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reportReason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motivo del reporte
              </label>
              <select
                id="reportReason"
                name="reason"
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reportDesc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descripción (opcional)
              </label>
              <textarea
                id="reportDesc"
                name="description"
                rows={3}
                maxLength={1000}
                placeholder="Describe brevemente el problema…"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reportEmail" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tu email (opcional — no se muestra públicamente)
              </label>
              <input
                id="reportEmail"
                name="reporter_email"
                type="email"
                maxLength={254}
                placeholder="tu@ejemplo.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                className="bg-rose-500 hover:bg-rose-600"
              >
                Enviar reporte
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setOpen(false); setResult(null) }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
