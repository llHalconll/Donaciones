'use client'

import { useState, useTransition } from 'react'
import { googleOAuthAction } from '@/app/auth/actions'

interface Props {
  label?: string
  legalAccepted?: boolean
  requireLegalAcceptance?: boolean
}

export function GoogleButton({
  label = 'Continuar con Google',
  legalAccepted = false,
  requireLegalAcceptance = false,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)

    if (requireLegalAcceptance && !legalAccepted) {
      setError(
        'Debes aceptar los Términos de Servicio y la Política de Privacidad para continuar.'
      )
      return
    }

    startTransition(async () => {
      const result = await googleOAuthAction(
        requireLegalAcceptance && legalAccepted
      )
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="
          w-full flex items-center justify-center gap-3
          px-4 py-2.5 rounded-xl text-sm font-medium
          border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900
          text-slate-700 dark:text-slate-200
          hover:bg-slate-50 dark:hover:bg-slate-800
          hover:border-slate-300 dark:hover:border-slate-600
          transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
          disabled:opacity-60 disabled:cursor-not-allowed
        "
        aria-label={label}
      >
        {isPending ? (
          <svg className="w-4 h-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        )}
        <span>{isPending ? 'Redirigiendo…' : label}</span>
      </button>
    </div>
  )
}
