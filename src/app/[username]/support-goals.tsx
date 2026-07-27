'use client'

import Image from 'next/image'
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

      <div className="space-y-3">
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
          const featuredId = getFeaturedSupportAmountId(goal.amounts)

          return (
            <section
              key={goal.id}
              className={`overflow-hidden rounded-2xl border bg-white transition-colors dark:bg-slate-950/30 ${
                isOpen
                  ? 'border-emerald-500/50'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <h3>
                <button
                  type="button"
                  onClick={() => handleGoalToggle(goal.id)}
                  aria-expanded={isOpen}
                  aria-controls={`support-goal-panel-${goal.id}`}
                  className="flex min-h-20 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                >
                  {goal.cover_url ? (
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={goal.cover_url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl"
                      aria-hidden="true"
                    >
                      {goal.emoji || '♥'}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 break-words font-bold text-slate-900 [overflow-wrap:anywhere] dark:text-white">
                      {goal.emoji && goal.cover_url ? `${goal.emoji} ` : ''}
                      {goal.title}
                    </span>
                    {goal.description && (
                      <span className="mt-0.5 line-clamp-2 break-words text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                        {goal.description}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-slate-400" aria-hidden="true">
                    {isOpen ? (
                      <ChevronUp className="size-5" />
                    ) : (
                      <ChevronDown className="size-5" />
                    )}
                  </span>
                </button>
              </h3>

              {isOpen && (
                <div
                  id={`support-goal-panel-${goal.id}`}
                  className="border-t border-slate-200 px-4 py-4 dark:border-slate-800"
                >
                  <div
                    role="group"
                    aria-label={`Niveles de apoyo para ${goal.title}`}
                    className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3 sm:grid-cols-4"
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
                          className={`relative flex h-12 min-w-0 items-center justify-center rounded-full px-2 text-center text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-slate-950 ${
                            isSelected
                              ? 'bg-emerald-500 text-white dark:text-slate-950'
                              : 'bg-slate-100 text-slate-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-emerald-300'
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
                                className="ml-1 size-3 shrink-0 fill-current"
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
                      className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {isExpanded
                        ? 'Ver menos'
                        : `Ver todos los niveles (${goal.amounts.length})`}
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
                      className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
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
                      className={`hotmart-fb hotmart__button-checkout mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-center text-base font-bold text-white transition-colors hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-slate-950 dark:focus-visible:ring-offset-slate-900 ${
                        isRedirecting ? 'pointer-events-none opacity-70' : ''
                      }`}
                    >
                      {isRedirecting ? (
                        <LoaderCircle
                          className="size-5 animate-spin motion-reduce:animate-none"
                          aria-hidden="true"
                        />
                      ) : (
                        <ExternalLink
                          className="size-5"
                          aria-hidden="true"
                        />
                      )}
                      {isRedirecting
                        ? 'Abriendo Hotmart…'
                        : getSupportCtaLabel(selectedAmount)}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-300 px-5 py-3 text-base font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
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
    </>
  )
}
