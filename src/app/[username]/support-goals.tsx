'use client'

import Script from 'next/script'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LoaderCircle,
  Star,
  X,
} from 'lucide-react'
import { trackPublicEvent } from '@/lib/analytics/public-client'
import {
  attachHotmartInline,
  getHotmartCheckoutPresentation,
  getHotmartOfferCode,
  HOTMART_CHECKOUT_ELEMENTS_SRC,
  type HotmartOverlayInstance,
  type HotmartScriptStatus,
} from '@/lib/hotmart-checkout'
import { formatSupportAmount } from '@/lib/presentation'
import {
  canStartSupportCheckout,
  getFeaturedSupportAmountId,
  getInitialSupportAmountId,
  getSelectedSupportAmount,
  getSupportCtaLabel,
  getVisibleSupportAmounts,
  isSupportAmountAvailable,
  type PublicSupportGoal,
} from '@/lib/support-goals'

interface Props {
  goals: PublicSupportGoal[]
  profileId: string
}

const SUPPORT_CTA_CLASS =
  'mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.625rem] bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:-translate-y-px hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 dark:text-slate-950 dark:focus-visible:ring-offset-slate-900'

/** Checkout modal state */
interface CheckoutModal {
  open: boolean
  offerCode: string | null
  checkoutUrl: string | null
  /** true while the inline checkout is being initialized inside the modal */
  initializing: boolean
}

const MODAL_CLOSED: CheckoutModal = {
  open: false,
  offerCode: null,
  checkoutUrl: null,
  initializing: false,
}

export function PublicSupportGoals({ goals, profileId }: Props) {
  const [openGoalId, setOpenGoalId] = useState<string | null>(
    goals[0]?.id ?? null
  )
  const [selectedByGoal, setSelectedByGoal] = useState<Record<string, string | null>>(
    () =>
      Object.fromEntries(
        goals.map((goal) => [
          goal.id,
          getInitialSupportAmountId(goal.amounts),
        ])
      )
  )
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(
    () => new Set()
  )
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isActivatingCheckout, setIsActivatingCheckout] = useState(false)
  const [scriptStatus, setScriptStatus] =
    useState<HotmartScriptStatus>('loading')

  // ── Overlay-compatible states (kept so getHotmartCheckoutPresentation ──
  // ── logic and existing tests remain unchanged)                         ──
  const [attachedAmountId, setAttachedAmountId] = useState<string | null>(null)
  const [failedOverlayAmountIds, setFailedOverlayAmountIds] = useState<Set<string>>(
    () => new Set()
  )

  // ── Checkout modal (our own modal with inlineCheckout inside) ──────────
  const [checkoutModal, setCheckoutModal] = useState<CheckoutModal>(MODAL_CLOSED)
  const inlineInstanceRef = useRef<HotmartOverlayInstance | null>(null)
  const checkoutContainerRef = useRef<HTMLDivElement | null>(null)

  const checkoutLockRef = useRef(false)
  const checkoutTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (checkoutTimeoutRef.current !== null) {
        window.clearTimeout(checkoutTimeoutRef.current)
      }
    }
  }, [])

  // ── Derived state ──────────────────────────────────────────────────────
  const openGoal = useMemo(
    () => goals.find((goal) => goal.id === openGoalId) ?? null,
    [goals, openGoalId]
  )
  const selectedAmount = useMemo(() => {
    if (!openGoal) return null
    return getSelectedSupportAmount(
      openGoal.amounts,
      selectedByGoal[openGoal.id] ?? null
    )
  }, [openGoal, selectedByGoal])

  // Keep checkoutPresentation using the same logic as before so tests pass.
  const checkoutPresentation = useMemo(
    () =>
      getHotmartCheckoutPresentation({
        amount: selectedAmount,
        scriptStatus,
        attachedAmountId,
        failedAmountIds: failedOverlayAmountIds,
      }),
    [selectedAmount, scriptStatus, attachedAmountId, failedOverlayAmountIds]
  )

  const hasOverlayCandidates = useMemo(
    () =>
      goals.some((goal) =>
        goal.amounts.some((amount) => Boolean(getHotmartOfferCode(amount)))
      ),
    [goals]
  )

  // Marks the current amount as 'attached' when the script is ready so that
  // checkoutPresentation transitions from 'loading' → 'overlay'.
  // Uses requestAnimationFrame to satisfy the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (scriptStatus !== 'ready') return

    const frame = window.requestAnimationFrame(() => {
      setAttachedAmountId(null)

      if (!selectedAmount) return
      if (!getHotmartOfferCode(selectedAmount)) return
      if (failedOverlayAmountIds.has(selectedAmount.id)) return
      setAttachedAmountId(selectedAmount.id)
    })

    return () => window.cancelAnimationFrame(frame)
  // selectedAmount?.id is the stable key; other deps are read inside rAF.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAmount?.id, scriptStatus])

  // ── Initialize inline checkout inside the modal ────────────────────────
  useEffect(() => {
    if (!checkoutModal.open || !checkoutModal.offerCode) return
    if (scriptStatus === 'error') return

    // If script is still loading, the retry effect below will handle it
    // once scriptStatus becomes 'ready'.
    if (scriptStatus === 'loading') return

    // Script is ready: mount inline checkout
    const api = window.checkoutElements
    if (!api) return

    const containerId = 'hotmart-inline-checkout-container'
    const offerCode = checkoutModal.offerCode
    const fallbackUrl = checkoutModal.checkoutUrl

    const frame = window.requestAnimationFrame(() => {
      try {
        const instance = attachHotmartInline({
          api,
          containerSelector: `#${containerId}`,
          offerCode,
        })
        inlineInstanceRef.current = instance
        setCheckoutModal((prev) => ({ ...prev, initializing: false }))
      } catch {
        // Inline checkout failed → close modal and open fallback URL
        setCheckoutModal(MODAL_CLOSED)
        inlineInstanceRef.current = null
        checkoutLockRef.current = false
        setIsActivatingCheckout(false)
        if (fallbackUrl) {
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
        }
        if (selectedAmount) {
          setFailedOverlayAmountIds((current) => {
            const next = new Set(current)
            next.add(selectedAmount.id)
            return next
          })
        }
      }
    })

    return () => window.cancelAnimationFrame(frame)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutModal.open, checkoutModal.offerCode, scriptStatus])

  // Retry initialization when script becomes ready while modal is open
  useEffect(() => {
    if (scriptStatus !== 'ready' || !checkoutModal.open) return

    const api = window.checkoutElements
    if (!api || !checkoutModal.offerCode) return

    const containerId = 'hotmart-inline-checkout-container'
    const offerCode = checkoutModal.offerCode
    const fallbackUrl = checkoutModal.checkoutUrl

    const frame = window.requestAnimationFrame(() => {
      try {
        const instance = attachHotmartInline({
          api,
          containerSelector: `#${containerId}`,
          offerCode,
        })
        inlineInstanceRef.current = instance
        setCheckoutModal((prev) => ({ ...prev, initializing: false }))
      } catch {
        setCheckoutModal(MODAL_CLOSED)
        inlineInstanceRef.current = null
        checkoutLockRef.current = false
        setIsActivatingCheckout(false)
        if (fallbackUrl) {
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
        }
      }
    })

    return () => window.cancelAnimationFrame(frame)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptStatus])

  // ── Escape key to close modal ──────────────────────────────────────────
  useEffect(() => {
    if (!checkoutModal.open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCheckoutModal()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [checkoutModal.open])


  // ── Body scroll lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (!checkoutModal.open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [checkoutModal.open])

  // ── Open / close helpers ───────────────────────────────────────────────
  function openCheckoutModal(offerCode: string, checkoutUrl: string) {
    inlineInstanceRef.current = null
    setCheckoutModal({
      open: true,
      offerCode,
      checkoutUrl,
      initializing: true,
    })
  }

  function closeCheckoutModal() {
    // Try to clean up the inline instance if the API exposes a destroy method
    const instance = inlineInstanceRef.current
    if (instance && typeof (instance as unknown as Record<string, unknown>).destroy === 'function') {
      ;(instance as unknown as { destroy(): void }).destroy()
    }
    inlineInstanceRef.current = null
    checkoutLockRef.current = false
    setIsActivatingCheckout(false)
    setCheckoutModal(MODAL_CLOSED)
  }

  // ── Analytics ─────────────────────────────────────────────────────────
  const trackEvent = useCallback(
    (
      eventType: 'amount_selected' | 'hotmart_redirect',
      supportAmountId: string
    ) =>
      trackPublicEvent({
        profileId,
        eventType,
        supportAmountId,
        keepalive: eventType === 'hotmart_redirect',
      }),
    [profileId]
  )

  // ── Interaction handlers ───────────────────────────────────────────────
  function handleGoalToggle(goalId: string) {
    if (checkoutLockRef.current) return
    setUrlError(null)
    setAttachedAmountId(null)
    setOpenGoalId((current) => (current === goalId ? null : goalId))
  }

  function handleAmountSelect(goalId: string, amountId: string) {
    if (checkoutLockRef.current) return
    const goal = goals.find((item) => item.id === goalId)
    const amount = goal?.amounts.find((item) => item.id === amountId)
    if (
      !amount ||
      !isSupportAmountAvailable(amount) ||
      selectedByGoal[goalId] === amountId
    ) {
      return
    }

    setSelectedByGoal((current) => ({ ...current, [goalId]: amountId }))
    setAttachedAmountId(null)
    setUrlError(null)
    void trackEvent('amount_selected', amountId)
  }

  function toggleAllAmounts(goalId: string) {
    setExpandedGoals((current) => {
      const next = new Set(current)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  function handleAmountKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    goalId: string,
    amountId: string
  ) {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return
    }

    const group = event.currentTarget.closest('[role="group"]')
    const options = Array.from(
      group?.querySelectorAll<HTMLButtonElement>(
        'button[data-amount-id]:not(:disabled)'
      ) ?? []
    )
    if (options.length === 0) return

    event.preventDefault()
    const currentIndex = options.indexOf(event.currentTarget)
    let nextIndex = currentIndex
    if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = options.length - 1
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      nextIndex = (currentIndex + 1) % options.length
    else nextIndex = (currentIndex - 1 + options.length) % options.length

    const next = options[nextIndex]
    next.focus()
    handleAmountSelect(goalId, next.dataset.amountId ?? amountId)
  }

  function beginCheckoutActivation() {
    if (
      !canStartSupportCheckout({
        locked: checkoutLockRef.current,
        amount: selectedAmount,
        checkoutUrl: checkoutPresentation.checkoutUrl,
      })
    ) {
      if (!checkoutLockRef.current) {
        setUrlError(
          'Este nivel no tiene un checkout válido. Elige otro nivel o contacta al creador.'
        )
      }
      return false
    }

    checkoutLockRef.current = true
    setUrlError(null)
    setIsActivatingCheckout(true)
    void trackEvent('hotmart_redirect', selectedAmount!.id)

    checkoutTimeoutRef.current = window.setTimeout(() => {
      checkoutLockRef.current = false
      setIsActivatingCheckout(false)
      checkoutTimeoutRef.current = null
    }, 1500)

    return true
  }

  /** Called when user clicks the CTA in 'overlay' (now inline) mode */
  function handleInlineSupport() {
    if (!beginCheckoutActivation()) return
    if (checkoutPresentation.kind !== 'overlay') return

    openCheckoutModal(checkoutPresentation.offerCode, checkoutPresentation.checkoutUrl)
  }

  function handleFallbackSupport(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      checkoutPresentation.kind !== 'fallback' ||
      !beginCheckoutActivation()
    ) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // ── Backdrop click: close only if clicking the dark overlay itself ─────
  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) closeCheckoutModal()
  }

  // ──────────────────────────────────────────────────────────────────────
  return (
    <>
      {hasOverlayCandidates && (
        <Script
          id="hotmart-checkout-elements"
          src={HOTMART_CHECKOUT_ELEMENTS_SRC}
          strategy="afterInteractive"
          onLoad={() =>
            setScriptStatus(window.checkoutElements ? 'ready' : 'error')
          }
          onReady={() =>
            setScriptStatus(window.checkoutElements ? 'ready' : 'error')
          }
          onError={() => setScriptStatus('error')}
        />
      )}

      {/* ── Checkout modal ───────────────────────────────────────────── */}
      {checkoutModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Checkout de Hotmart"
          className="checkout-modal-backdrop"
          onClick={handleBackdropClick}
        >
          <div className="checkout-modal-panel" ref={checkoutContainerRef}>
            {/* Close button */}
            <button
              type="button"
              onClick={closeCheckoutModal}
              aria-label="Cerrar checkout"
              className="checkout-modal-close"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            {/* Inline checkout container */}
            <div className="checkout-modal-body">
              {checkoutModal.initializing && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <LoaderCircle
                    className="size-8 animate-spin text-emerald-500 motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Preparando pago seguro…
                  </p>
                </div>
              )}
              {/* Hotmart inlineCheckout mounts here */}
              <div
                id="hotmart-inline-checkout-container"
                className={checkoutModal.initializing ? 'hidden' : 'block min-h-[400px]'}
                aria-live="polite"
              />
            </div>

            {/* Footer note */}
            <p className="px-4 pb-3 pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
              Pago gestionado por Hotmart. DonacionesSaaS no almacena tus datos de pago.
            </p>
          </div>
        </div>
      )}

      {/* ── Goals accordion ─────────────────────────────────────────── */}
      <div className="divide-y divide-slate-200/80 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/70 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/45">
        {goals.map((goal) => {
          const isOpen = goal.id === openGoalId
          const selectedId =
            selectedByGoal[goal.id] ?? getInitialSupportAmountId(goal.amounts)
          const isExpanded = expandedGoals.has(goal.id)
          const visibleAmounts = getVisibleSupportAmounts(
            goal.amounts,
            selectedId,
            isExpanded
          )
          const hiddenAmountCount =
            goal.amounts.length - visibleAmounts.length
          const featuredId = getFeaturedSupportAmountId(goal.amounts)

          return (
            <section
              key={goal.id}
              className={`overflow-hidden transition-colors duration-200 ${
                isOpen
                  ? 'bg-white dark:bg-slate-900/85'
                  : 'hover:bg-white dark:hover:bg-slate-900/65'
              }`}
            >
              <h3>
                <button
                  type="button"
                  onClick={() => handleGoalToggle(goal.id)}
                  aria-expanded={isOpen}
                  aria-controls={`support-goal-panel-${goal.id}`}
                  className="flex min-h-[4.5rem] w-full items-center gap-2.5 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:px-3.5"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-xl ring-1 ring-inset ring-emerald-500/15"
                    aria-hidden="true"
                  >
                    {goal.emoji || '♥'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 break-words text-[15px] font-semibold leading-5 text-slate-900 [overflow-wrap:anywhere] dark:text-white">
                      {goal.title}
                    </span>
                    {goal.description && (
                      <span className="mt-0.5 line-clamp-1 break-words text-[12px] leading-4 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                        {goal.description}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              {isOpen && (
                <div
                  id={`support-goal-panel-${goal.id}`}
                  className="support-panel border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800 sm:px-3.5"
                >
                  <div
                    role="group"
                    aria-label={`Niveles de apoyo para ${goal.title}`}
                    className="flex flex-wrap gap-1.5"
                  >
                    {visibleAmounts.map((amount) => {
                      const isSelected = amount.id === selectedId
                      const isAvailable = isSupportAmountAvailable(amount)
                      return (
                        <button
                          key={amount.id}
                          type="button"
                          aria-pressed={isSelected}
                          data-amount-id={amount.id}
                          tabIndex={isSelected ? 0 : -1}
                          disabled={!isAvailable || isActivatingCheckout}
                          onClick={() =>
                            handleAmountSelect(goal.id, amount.id)
                          }
                          onKeyDown={(event) =>
                            handleAmountKeyDown(event, goal.id, amount.id)
                          }
                          className={`relative inline-flex min-h-9 min-w-[4.25rem] flex-none items-center justify-center rounded-[0.625rem] border px-2.5 text-center text-[13px] font-semibold transition-[border-color,background-color,color,transform] duration-150 ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 dark:focus-visible:ring-offset-slate-950 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500/45 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400/45 dark:hover:text-emerald-300'
                          }`}
                        >
                          <span className="truncate">
                            {formatSupportAmount(
                              Number(amount.amount),
                              amount.currency
                            )}
                          </span>
                          {amount.id === featuredId && (
                            <>
                              <Star
                                className="ml-1 size-2.5 shrink-0 fill-current"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Recomendado</span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {goal.amounts.length > 8 && (
                    <button
                      type="button"
                      onClick={() => toggleAllAmounts(goal.id)}
                      aria-expanded={isExpanded}
                      className="mt-1.5 inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-emerald-300"
                    >
                      {isExpanded
                        ? 'Ver menos'
                        : `+${hiddenAmountCount} ${
                            hiddenAmountCount === 1 ? 'nivel' : 'niveles'
                          } más`}
                      {isExpanded ? (
                        <ChevronUp className="size-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  )}

                  {urlError && openGoalId === goal.id && (
                    <div
                      role="alert"
                      className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
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

                  {/* ── CTA button ─────────────────────────────────── */}
                  {selectedAmount &&
                  checkoutPresentation.kind === 'overlay' ? (
                    // Inline checkout via our own modal
                    <button
                      key={selectedAmount.id}
                      id={`hotmart-support-${selectedAmount.id}`}
                      type="button"
                      disabled={isActivatingCheckout}
                      onClick={handleInlineSupport}
                      aria-describedby={`hotmart-payment-note-${goal.id}`}
                      aria-label={`${getSupportCtaLabel(selectedAmount)} mediante Hotmart`}
                      className={SUPPORT_CTA_CLASS}
                    >
                      {isActivatingCheckout ? (
                        <LoaderCircle
                          className="size-4 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                      ) : null}
                      {isActivatingCheckout
                        ? 'Abriendo Hotmart…'
                        : getSupportCtaLabel(selectedAmount)}
                    </button>
                  ) : selectedAmount &&
                    checkoutPresentation.kind === 'loading' ? (
                    <button
                      key={selectedAmount.id}
                      id={`hotmart-support-${selectedAmount.id}`}
                      type="button"
                      disabled
                      aria-describedby={`hotmart-payment-note-${goal.id}`}
                      className={SUPPORT_CTA_CLASS}
                    >
                      <LoaderCircle
                        className="size-4 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                      Preparando pago seguro…
                    </button>
                  ) : selectedAmount &&
                    checkoutPresentation.kind === 'fallback' ? (
                    <a
                      href={checkoutPresentation.checkoutUrl}
                      onClick={handleFallbackSupport}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={isActivatingCheckout}
                      aria-describedby={`hotmart-payment-note-${goal.id}`}
                      aria-label={
                        isActivatingCheckout
                          ? 'Abriendo Hotmart'
                          : `${getSupportCtaLabel(selectedAmount)} mediante Hotmart`
                      }
                      className={`${SUPPORT_CTA_CLASS} ${
                        isActivatingCheckout
                          ? 'pointer-events-none opacity-70'
                          : ''
                      }`}
                    >
                      {isActivatingCheckout ? (
                        <LoaderCircle
                          className="size-4 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                      ) : (
                        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                      )}
                      {isActivatingCheckout
                        ? 'Abriendo Hotmart…'
                        : getSupportCtaLabel(selectedAmount)}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-2.5 flex min-h-11 w-full items-center justify-center rounded-[0.625rem] bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    >
                      No hay niveles disponibles
                    </button>
                  )}

                  {checkoutPresentation.kind !== 'unavailable' && (
                    <p
                      id={`hotmart-payment-note-${goal.id}`}
                      role="status"
                      aria-live="polite"
                      className="mt-2 px-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400"
                    >
                      {checkoutPresentation.kind === 'fallback'
                        ? 'Continuarás en Hotmart para completar el pago.'
                        : 'Pago gestionado por Hotmart sin salir de esta página. DonacionesSaaS no almacena tus datos de pago.'}
                    </p>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <style>{`
        /* ── Accordion panel animation ─────────────────────────────── */
        .support-panel {
          animation: support-panel-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes support-panel-in {
          from { opacity: 0; transform: translateY(-0.25rem); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-panel { animation: none; }
        }

        /* ── Checkout modal backdrop ───────────────────────────────── */
.checkout-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  animation: backdrop-in 200ms ease-out;
}

        @keyframes backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Checkout modal panel ──────────────────────────────────── */
.checkout-modal-panel {
  position: relative;
  width: min(94vw, 680px);
  max-height: 86dvh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.35),
    0 8px 24px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: modal-in 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

        @media (prefers-color-scheme: dark) {
          .checkout-modal-panel {
            background: #0f172a;
            box-shadow:
              0 25px 60px rgba(0, 0, 0, 0.6),
              0 8px 24px rgba(0, 0, 0, 0.4);
          }
        }

        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .checkout-modal-backdrop,
          .checkout-modal-panel { animation: none; }
        }

        /* ── Close button ──────────────────────────────────────────── */
        .checkout-modal-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.9);
          color: #334155;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          transition: background 150ms, color 150ms, transform 150ms;
          cursor: pointer;
          border: none;
        }

        .checkout-modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
          transform: scale(1.08);
        }

        .checkout-modal-close:focus-visible {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }

        @media (prefers-color-scheme: dark) {
          .checkout-modal-close {
            background: rgba(30, 41, 59, 0.9);
            color: #cbd5e1;
          }
          .checkout-modal-close:hover {
            background: #1e293b;
            color: #f8fafc;
          }
        }

        /* ── Modal body (scrollable) ───────────────────────────────── */
        .checkout-modal-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          /* Allow Hotmart iframe to fill the panel */
          min-height: 400px;
        }

        /* Hotmart inline checkout iframe fills the container */
#hotmart-inline-checkout-container {
  width: 100%;
  overflow: hidden;
}

#hotmart-inline-checkout-container iframe {
  display: block;
  width: 100% !important;
  min-height: 720px;
  border: 0;
}

        /* Mobile: occupy most of the viewport */
@media (max-width: 640px) {
  .checkout-modal-backdrop {
    padding: 0.75rem;
    align-items: center;
  }

  .checkout-modal-panel {
    width: 100%;
    max-height: 94dvh;
    border-radius: 1rem;
  }

  #hotmart-inline-checkout-container iframe {
    min-height: 760px;
  }
}
      `}</style>
    </>
  )
}
