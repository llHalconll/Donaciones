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
  LoaderCircle,
  Star,
  X,
} from 'lucide-react'
import { trackPublicEvent } from '@/lib/analytics/public-client'
import { formatSupportAmount } from '@/lib/presentation'
import {
  buildHotmartWidgetUrl,
  canStartSupportRedirect,
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
  const checkoutUrl = useMemo(
    () => buildHotmartWidgetUrl(selectedAmount),
    [selectedAmount]
  )

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

  function handleGoalToggle(goalId: string) {
    if (redirectLockRef.current) return
    setUrlError(null)
    setOpenGoalId((current) => (current === goalId ? null : goalId))
  }

  function handleAmountSelect(goalId: string, amountId: string) {
    if (redirectLockRef.current) return
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

  function handleSupport(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      !canStartSupportRedirect({
        locked: redirectLockRef.current,
        amount: selectedAmount,
        checkoutUrl,
      })
    ) {
      event.preventDefault()
      if (!redirectLockRef.current) {
        setUrlError(
          'Este nivel no tiene un checkout válido. Elige otro nivel o contacta al creador.'
        )
      }
      return
    }

    redirectLockRef.current = true
    setUrlError(null)
    setIsRedirecting(true)
    void trackEvent('hotmart_redirect', selectedAmount!.id)

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
                          disabled={!isAvailable || isRedirecting}
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

                  {selectedAmount && checkoutUrl ? (
                    <a
                      href={checkoutUrl}
                      onClick={handleSupport}
                      aria-disabled={isRedirecting}
                      aria-label={
                        isRedirecting
                          ? 'Abriendo Hotmart'
                          : `${getSupportCtaLabel(
                              selectedAmount
                            )} mediante Hotmart`
                      }
                      className={`hotmart-fb hotmart__button-checkout mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.625rem] bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-150 ease-out hover:-translate-y-px hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-0 dark:text-slate-950 dark:focus-visible:ring-offset-slate-900 ${
                        isRedirecting ? 'pointer-events-none opacity-70' : ''
                      }`}
                    >
                      {isRedirecting ? (
                        <LoaderCircle
                          className="size-4 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                      ) : null}
                      {isRedirecting
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
                </div>
              )}
            </section>
          )
        })}
      </div>

      <style>{`
        .support-panel {
          animation: support-panel-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes support-panel-in {
          from {
            opacity: 0;
            transform: translateY(-0.25rem);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-panel {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}
