'use client'

import { useState, useCallback } from 'react'
import { Star, ExternalLink, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react'
import type { DonationButton } from '@/types/database.types'

interface Props {
  buttons: Pick<DonationButton, 'id' | 'title' | 'emoji' | 'description' | 'amount' | 'currency' | 'hotmart_checkout_url' | 'button_label' | 'is_featured'>[]
  profileId: string
}

function generateSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const SESSION_ID_KEY = 'dsaas_session'

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return null
  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = generateSessionId()
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

export function PublicAmountGrid({ buttons, profileId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    buttons.find((b) => b.is_featured)?.id ?? null
  )
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const selectedButton = buttons.find((b) => b.id === selectedId)

  const trackEvent = useCallback(
    async (eventType: 'amount_selected' | 'hotmart_redirect', buttonId: string) => {
      try {
        const sessionId = getOrCreateSessionId()
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: profileId,
            donation_button_id: buttonId,
            event_type: eventType,
            session_id: sessionId,
            referrer: document.referrer ? document.referrer.slice(0, 200) : null,
          }),
        })
      } catch {
        // Analytics failure must never block the user flow
      }
    },
    [profileId]
  )

  function handleSelect(id: string) {
    setSelectedId(id)
    setUrlError(null)
    trackEvent('amount_selected', id)
  }

  async function handleSupport() {
    if (!selectedButton) return
    setUrlError(null)
    setIsRedirecting(true)

    await trackEvent('hotmart_redirect', selectedButton.id)

    // Validate URL client-side before redirecting (defense in depth)
    try {
      const parsed = new URL(selectedButton.hotmart_checkout_url)
      if (parsed.protocol !== 'https:') throw new Error('Insecure URL')
      window.location.href = selectedButton.hotmart_checkout_url
    } catch {
      setIsRedirecting(false)
      setUrlError('El enlace de este monto no es válido. Por favor contacta al creador.')
    }
  }

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-4">
      {/* Inline error notification — replaces native alert() */}
      {urlError && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="flex-1">{urlError}</p>
          <button
            onClick={() => setUrlError(null)}
            className="p-0.5 hover:opacity-60 transition"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Amount grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="listbox" aria-label="Montos de apoyo disponibles">
        {buttons.map((btn) => {
          const isSelected = selectedId === btn.id
          return (
            <button
              key={btn.id}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(btn.id)}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 bg-white dark:bg-slate-900'
              }`}
            >
              {btn.is_featured && (
                <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-white" /> Popular
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {btn.emoji ? <>{btn.emoji} {btn.title}</> : btn.title}
                  </p>
                  {btn.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{btn.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-base font-extrabold font-mono ${
                    isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {formatAmount(Number(btn.amount), btn.currency)}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Seleccionado
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* CTA button — sticky on mobile */}
      <div className="sticky bottom-4">
        <button
          onClick={handleSupport}
          disabled={!selectedButton || isRedirecting}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base transition-all shadow-lg hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          aria-live="polite"
        >
          {isRedirecting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Redirigiendo&#8230;</>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              {selectedButton
                ? `${selectedButton.emoji ? selectedButton.emoji + ' ' : ''}${selectedButton.button_label ?? 'Apoyar ahora'} · ${formatAmount(Number(selectedButton.amount), selectedButton.currency)}`
                : 'Selecciona un monto'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
