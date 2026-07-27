'use client'

import { useCallback, useMemo, useState } from 'react'
import Script from 'next/script'
import { AlertCircle, Check, ExternalLink, LoaderCircle, Star, X } from 'lucide-react'
import { trackPublicEvent } from '@/lib/analytics/public-client'
import type { DonationButton } from '@/types/database.types'
import { validateHotmartUrl } from '@/lib/validations/url'

interface Props {
  buttons: Pick<DonationButton, 'id' | 'title' | 'emoji' | 'description' | 'amount' | 'currency' | 'hotmart_checkout_url' | 'button_label' | 'is_featured'>[]
  profileId: string
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('es-CO')}`
  }
}

function isAvailableButton(button: Props['buttons'][number]) {
  const amount = Number(button.amount)
  return Number.isFinite(amount) && amount > 0 && validateHotmartUrl(button.hotmart_checkout_url).ok
}

export function PublicAmountGrid({ buttons, profileId }: Props) {
  const availability = useMemo(
    () => new Map(buttons.map((button) => [button.id, isAvailableButton(button)])),
    [buttons]
  )
  const featuredId = useMemo(
    () => buttons.find((button) => button.is_featured)?.id ?? null,
    [buttons]
  )
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const featuredButton = buttons.find(
      (button) => button.id === featuredId && availability.get(button.id)
    )
    return featuredButton?.id ?? buttons.find((button) => availability.get(button.id))?.id ?? null
  })
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const selectedButton =
    buttons.find((button) => button.id === selectedId && availability.get(button.id)) ?? null

  const widgetCheckoutUrl = useMemo(() => {
    if (!selectedButton || !Number.isFinite(Number(selectedButton.amount)) || Number(selectedButton.amount) <= 0) return null
    const result = validateHotmartUrl(selectedButton.hotmart_checkout_url)
    if (!result.ok || !result.normalizedUrl) return null
    const parsed = new URL(result.normalizedUrl)
    parsed.searchParams.set('checkoutMode', '2')
    return parsed.toString()
  }, [selectedButton])

  const trackEvent = useCallback((eventType: 'amount_selected' | 'hotmart_redirect', buttonId: string) => {
    return trackPublicEvent({
      profileId,
      eventType,
      buttonId,
      keepalive: eventType === 'hotmart_redirect',
    })
  }, [profileId])

  function handleSelect(id: string) {
    if (isRedirecting || id === selectedId || !availability.get(id)) return
    setSelectedId(id)
    setUrlError(null)
    void trackEvent('amount_selected', id)
  }

  function handleSupport(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isRedirecting) {
      event.preventDefault()
      return
    }
    if (!selectedButton || !widgetCheckoutUrl) {
      event.preventDefault()
      setUrlError('Esta opción no tiene un enlace válido. Elige otra o contacta al creador.')
      return
    }
    setUrlError(null)
    setIsRedirecting(true)
    void trackEvent('hotmart_redirect', selectedButton.id)

    // Hotmart's widget opens over the current page. Re-enable the CTA if the
    // visitor closes it instead of completing the redirect.
    window.setTimeout(() => setIsRedirecting(false), 4000)
  }

  return (
    <>
      <Script src="https://static.hotmart.com/checkout/widget.min.js" strategy="afterInteractive" />
      <div className="space-y-5">
        <fieldset id="opciones-apoyo" disabled={isRedirecting}>
          <legend className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">Elige una opción</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {buttons.map((button) => {
              const isSelected = selectedId === button.id
              const amount = Number(button.amount)
              const isValid = availability.get(button.id) === true
              const descriptionId = button.description
                ? `support-description-${button.id}`
                : null
              const unavailableId = !isValid
                ? `support-unavailable-${button.id}`
                : null
              const describedBy = [descriptionId, unavailableId].filter(Boolean).join(' ') || undefined

              return (
                <label
                  key={button.id}
                  className={`relative flex min-h-36 cursor-pointer flex-col rounded-2xl border-2 p-4 transition-[border-color,background-color,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 ${
                    !isValid
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-950'
                      : isSelected
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="support-option"
                    value={button.id}
                    checked={isSelected}
                    disabled={!isValid || isRedirecting}
                    onChange={() => handleSelect(button.id)}
                    className="sr-only"
                    aria-describedby={describedBy}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {button.id === featuredId && (
                        <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          <Star className="size-3 fill-current" aria-hidden="true" />
                          Destacada
                        </span>
                      )}
                      <p className="line-clamp-2 font-bold leading-snug text-slate-900 dark:text-white">
                        {button.emoji && <span aria-hidden="true">{button.emoji} </span>}
                        {button.title}
                      </p>
                    </div>
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent dark:border-slate-600'}`} aria-hidden="true">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </div>
                  {button.description && (
                    <p id={`support-description-${button.id}`} className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {button.description}
                    </p>
                  )}
                  <p className={`mt-auto pt-4 text-xl font-black tracking-tight ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {formatAmount(amount, button.currency)}
                  </p>
                  {!isValid && (
                    <span
                      id={`support-unavailable-${button.id}`}
                      className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      No disponible
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="min-h-20" aria-live="polite" aria-atomic="true">
          {selectedButton && (
            <div className="flex min-h-20 items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-xl" aria-hidden="true">{selectedButton.emoji || '♥'}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Vas a apoyar con</p>
                <p className="break-words text-sm font-bold text-slate-900 dark:text-white">
                  {selectedButton.title} · {formatAmount(Number(selectedButton.amount), selectedButton.currency)}
                </p>
              </div>
            </div>
          )}
        </div>

        {urlError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">{urlError}</p>
            <button type="button" onClick={() => setUrlError(null)} className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" aria-label="Cerrar mensaje de error">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {selectedButton && widgetCheckoutUrl ? (
          <a
            href={widgetCheckoutUrl}
            onClick={handleSupport}
            aria-disabled={isRedirecting}
            aria-label={
              isRedirecting
                ? 'Abriendo Hotmart'
                : `${selectedButton.button_label ?? 'Apoyar ahora'} con ${formatAmount(Number(selectedButton.amount), selectedButton.currency)} mediante Hotmart`
            }
            className={`hotmart-fb hotmart__button-checkout flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-center text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-slate-950 dark:focus-visible:ring-offset-slate-900 ${isRedirecting ? 'pointer-events-none opacity-70' : ''}`}
          >
            {isRedirecting ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ExternalLink className="size-5" aria-hidden="true" />}
            {isRedirecting ? 'Abriendo Hotmart…' : `${selectedButton.button_label ?? 'Apoyar ahora'} · ${formatAmount(Number(selectedButton.amount), selectedButton.currency)}`}
          </a>
        ) : (
          <button type="button" disabled className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-300 px-5 py-3 text-base font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            No hay opciones disponibles
          </button>
        )}
      </div>
    </>
  )
}
