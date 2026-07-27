'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Script from 'next/script'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LoaderCircle,
  Star,
  X,
} from 'lucide-react'
import { trackPublicEvent } from '@/lib/analytics/public-client'
import { formatSupportAmount } from '@/lib/presentation'
import {
  buildHotmartWidgetUrl,
  canStartSupportRedirect,
  getFeaturedSupportOptionId,
  getInitialSupportOptionId,
  getSelectedSupportOption,
  getSupportCtaLabel,
  getVisibleSupportOptions,
  isSupportOptionAvailable,
  type PublicSupportOption,
} from '@/lib/support-options'

interface Props {
  buttons: PublicSupportOption[]
  profileId: string
}

export function PublicAmountGrid({ buttons, profileId }: Props) {
  const availability = useMemo(
    () =>
      new Map(
        buttons.map((button) => [
          button.id,
          isSupportOptionAvailable(button),
        ])
      ),
    [buttons]
  )
  const featuredId = useMemo(
    () => getFeaturedSupportOptionId(buttons),
    [buttons]
  )
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    getInitialSupportOptionId(buttons)
  )
  const [expanded, setExpanded] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectLockRef = useRef(false)
  const redirectTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const selectedButton = useMemo(
    () => getSelectedSupportOption(buttons, selectedId),
    [buttons, selectedId]
  )
  const visibleButtons = useMemo(
    () => getVisibleSupportOptions(buttons, selectedId, expanded),
    [buttons, expanded, selectedId]
  )
  const widgetCheckoutUrl = useMemo(
    () => buildHotmartWidgetUrl(selectedButton),
    [selectedButton]
  )
  const hasAdditionalOptions = buttons.length > 4
  const hasBoundedExpandedPanel = expanded && buttons.length > 8
  const gridColumns =
    visibleButtons.length === 1
      ? 'grid-cols-1'
      : visibleButtons.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-2 sm:grid-cols-4'

  const trackEvent = useCallback(
    (
      eventType: 'amount_selected' | 'hotmart_redirect',
      buttonId: string
    ) => {
      return trackPublicEvent({
        profileId,
        eventType,
        buttonId,
        keepalive: eventType === 'hotmart_redirect',
      })
    },
    [profileId]
  )

  function handleSelect(id: string) {
    if (
      redirectLockRef.current ||
      id === selectedId ||
      !availability.get(id)
    ) {
      return
    }

    setSelectedId(id)
    setUrlError(null)
    void trackEvent('amount_selected', id)
  }

  function handleSupport(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      !canStartSupportRedirect({
        locked: redirectLockRef.current,
        option: selectedButton,
        checkoutUrl: widgetCheckoutUrl,
      })
    ) {
      event.preventDefault()
      if (!redirectLockRef.current) {
        setUrlError(
          'Esta opción no tiene un enlace válido. Elige otra o contacta al creador.'
        )
      }
      return
    }

    redirectLockRef.current = true
    setUrlError(null)
    setIsRedirecting(true)
    void trackEvent('hotmart_redirect', selectedButton!.id)

    redirectTimeoutRef.current = window.setTimeout(() => {
      redirectLockRef.current = false
      setIsRedirecting(false)
      redirectTimeoutRef.current = null
    }, 4000)
  }

  return (
    <>
      <Script
        src="https://static.hotmart.com/checkout/widget.min.js"
        strategy="afterInteractive"
      />
      <div className="space-y-4">
        <fieldset id="opciones-apoyo" disabled={isRedirecting}>
          <legend className="sr-only">Opciones de apoyo</legend>
          <div
            id="support-options-list"
            className={`grid ${gridColumns} gap-2.5 ${
              hasBoundedExpandedPanel
                ? 'max-h-72 overflow-y-auto overscroll-contain p-0.5 pr-1'
                : ''
            }`}
            aria-label={
              hasBoundedExpandedPanel
                ? 'Todas las opciones de apoyo; desplázate dentro de esta lista para ver más'
                : undefined
            }
          >
            {visibleButtons.map((button) => {
              const isSelected = selectedId === button.id
              const amount = Number(button.amount)
              const isValid = availability.get(button.id) === true
              const unavailableId = !isValid
                ? `support-unavailable-${button.id}`
                : undefined

              return (
                <label
                  key={button.id}
                  className={`relative flex min-h-28 cursor-pointer flex-col rounded-xl border p-3 transition-colors focus-within:z-10 focus-within:ring-2 focus-within:ring-emerald-500 ${
                    !isValid
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-60 dark:border-slate-800 dark:bg-slate-950/50'
                      : isSelected
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-slate-200 bg-white hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-950/30'
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
                    aria-describedby={unavailableId}
                  />

                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className="shrink-0 text-base leading-5"
                      aria-hidden="true"
                    >
                      {button.emoji || '♥'}
                    </span>
                    <span
                      title={button.title}
                      className="line-clamp-2 min-w-0 break-words text-sm font-bold leading-5 text-slate-900 [overflow-wrap:anywhere] dark:text-white"
                    >
                      {button.title}
                    </span>
                  </div>

                  <div className="mt-auto pt-3">
                    <p
                      className={`break-words text-lg font-black leading-tight tracking-tight [overflow-wrap:anywhere] ${
                        isSelected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {formatSupportAmount(amount, button.currency)}
                    </p>

                    {(button.id === featuredId || isSelected || !isValid) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {button.id === featuredId && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            <Star
                              className="size-2.5 fill-current"
                              aria-hidden="true"
                            />
                            Recomendada
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            <Check
                              className="size-3"
                              strokeWidth={3}
                              aria-hidden="true"
                            />
                            Seleccionada
                          </span>
                        )}
                        {!isValid && (
                          <span
                            id={unavailableId}
                            className="text-[10px] font-bold text-rose-600 dark:text-rose-400"
                          >
                            No disponible
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>

        {hasAdditionalOptions && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-controls="support-options-list"
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {expanded ? (
              <>
                Ver menos
                <ChevronUp className="size-4" aria-hidden="true" />
              </>
            ) : (
              <>
                Ver todas las opciones ({buttons.length})
                <ChevronDown className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        )}

        {selectedButton && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 border-y border-slate-200 py-3 dark:border-slate-800"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-base"
              aria-hidden="true"
            >
              {selectedButton.emoji || '♥'}
            </span>
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere] dark:text-white">
                {selectedButton.title}
              </p>
              <p className="mt-0.5 line-clamp-2 break-words text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                {selectedButton.description ||
                  'Esta opción se abrirá de forma segura en Hotmart.'}
              </p>
            </div>
          </div>
        )}

        {urlError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p className="flex-1">{urlError}</p>
            <button
              type="button"
              onClick={() => setUrlError(null)}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="Cerrar mensaje de error"
            >
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
                : `${getSupportCtaLabel(selectedButton)} mediante Hotmart`
            }
            className={`hotmart-fb hotmart__button-checkout flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-center text-base font-bold text-white transition-colors duration-200 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-slate-950 dark:focus-visible:ring-offset-slate-900 ${
              isRedirecting ? 'pointer-events-none opacity-70' : ''
            }`}
          >
            {isRedirecting ? (
              <LoaderCircle
                className="size-5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <ExternalLink className="size-5" aria-hidden="true" />
            )}
            {isRedirecting
              ? 'Abriendo Hotmart…'
              : getSupportCtaLabel(selectedButton)}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-300 px-5 py-3 text-base font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          >
            No hay opciones disponibles
          </button>
        )}
      </div>
    </>
  )
}
