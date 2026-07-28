'use client'

import Image from 'next/image'
import Script from 'next/script'
import { useCallback, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  X,
} from 'lucide-react'
import { trackPublicEvent } from '@/lib/analytics/public-client'
import { useCookieConsent } from '@/components/cookies/cookie-consent-provider'
import {
  HOTMART_WIDGET_SCRIPT_SRC,
  getHotmartWidgetUrl,
  getHotmartCheckoutUrl,
} from '@/lib/hotmart-checkout'
import { formatSupportAmount } from '@/lib/presentation'
import {
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
  'mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.625rem] bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white no-underline transition-[background-color,transform,opacity] duration-150 ease-out hover:-translate-y-px hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-0 dark:text-slate-950 dark:focus-visible:ring-offset-slate-900 lg:min-h-12 lg:rounded-xl lg:px-5 lg:text-base'

export function PublicSupportGoals({ goals, profileId }: Props) {
  const { hasConsent } = useCookieConsent()
  const analyticsAllowed = hasConsent('analytics')
  const [openGoalId, setOpenGoalId] = useState<string | null>(
    goals[0]?.id ?? null
  )
  const [selectedByGoal, setSelectedByGoal] = useState<
    Record<string, string | null>
  >(
    () =>
      Object.fromEntries(
        goals.map((goal) => [goal.id, getInitialSupportAmountId(goal.amounts)])
      )
  )
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(
    () => new Set()
  )
  const [urlError, setUrlError] = useState<string | null>(null)

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

  // The widget URL includes ?checkoutMode=2 (popup) and ?off={code} when available.
  // Without checkoutMode=2 the widget opens Hotmart in the current tab.
  const widgetUrl = useMemo(
    () => getHotmartWidgetUrl(selectedAmount),
    [selectedAmount]
  )
  const directCheckoutUrl = useMemo(
    () => getHotmartCheckoutUrl(selectedAmount),
    [selectedAmount]
  )
  const checkoutUrl = analyticsAllowed ? widgetUrl : directCheckoutUrl

  // Whether any goal has at least one amount with a valid checkout URL.
  // We only load the widget script when there is something to pay for.
  const hasValidCheckouts = useMemo(
    () =>
      goals.some((goal) =>
        goal.amounts.some((amount) => Boolean(getHotmartCheckoutUrl(amount)))
      ),
    [goals]
  )

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
    setUrlError(null)
    setOpenGoalId((current) => (current === goalId ? null : goalId))
  }

  function handleAmountSelect(goalId: string, amountId: string) {
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
    if (
      !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(
        event.key
      )
    ) {
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

  // ──────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Load Hotmart widget script once — it intercepts clicks on elements
          with class "hotmart-fb hotmart__button-checkout" and opens the
          checkout as a popup overlay (checkoutMode=2) without leaving the page. */}
      {hasValidCheckouts && analyticsAllowed && (
        <Script
          id="hotmart-widget"
          src={HOTMART_WIDGET_SCRIPT_SRC}
          strategy="afterInteractive"
        />
      )}

      {/* ── Goals accordion ────────────────────────────────────────────── */}
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
          const hiddenAmountCount = goal.amounts.length - visibleAmounts.length
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
                  className="flex min-h-[4.5rem] w-full items-center gap-2.5 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:px-3.5 lg:min-h-[5.25rem] lg:px-5"
                >
                  <span
                    className={`relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset lg:size-11 ${
                      goal.cover_url
                        ? 'bg-white ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'
                        : 'bg-emerald-500/12 ring-emerald-500/15'
                    }`}
                    aria-hidden="true"
                  >
                    {goal.cover_url ? (
                      <Image
                        src={goal.cover_url}
                        alt=""
                        fill
                        sizes="72px"
                        quality={95}
                        className="object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-xl">{goal.emoji || '♥'}</span>
                    )}
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
                  className="support-panel border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800 sm:px-3.5 lg:px-5 lg:pb-4 lg:pt-3.5"
                >
                  {/* ── Amount chips ──────────────────────────────────── */}
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
                          disabled={!isAvailable}
                          onClick={() => handleAmountSelect(goal.id, amount.id)}
                          onKeyDown={(event) =>
                            handleAmountKeyDown(event, goal.id, amount.id)
                          }
                          className={`relative inline-flex min-h-9 min-w-[4.25rem] flex-none items-center justify-center rounded-[0.625rem] border px-2.5 text-center text-[13px] font-semibold transition-[border-color,background-color,color,transform] duration-150 ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 dark:focus-visible:ring-offset-slate-950 lg:min-h-10 lg:min-w-[4.75rem] lg:text-sm ${
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

                  {/* ── Show more / less ──────────────────────────────── */}
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

                  {/* ── URL error ─────────────────────────────────────── */}
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

                  {/* ── CTA ───────────────────────────────────────────── */}
                  {checkoutUrl && selectedAmount ? (
                    /**
                     * Hotmart widget mode:
                     * - class "hotmart-fb hotmart__button-checkout" is required
                     *   so the widget.min.js script intercepts the click and
                     *   opens the checkout as a popup overlay (checkoutMode=2).
                     * - If the script hasn't loaded yet, the link opens the
                     *   checkout in a new tab (acceptable fallback).
                     * - onClick fires analytics tracking before Hotmart takes over.
                     */
                    <a
                      href={checkoutUrl}
                      target={analyticsAllowed ? undefined : '_blank'}
                      rel={analyticsAllowed ? undefined : 'noopener noreferrer'}
                      onClick={() =>
                        void trackEvent('hotmart_redirect', selectedAmount.id)
                      }
                      aria-describedby={`hotmart-payment-note-${goal.id}`}
                      aria-label={`${getSupportCtaLabel(selectedAmount)} mediante Hotmart`}
                      className={`${analyticsAllowed ? 'hotmart-fb hotmart__button-checkout ' : ''}${SUPPORT_CTA_CLASS}`}
                    >
                      {getSupportCtaLabel(selectedAmount)}
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

                  {/* ── Payment note ──────────────────────────────────── */}
                  {checkoutUrl && (
                    <p
                      id={`hotmart-payment-note-${goal.id}`}
                      className="mt-2 px-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400"
                    >
                      {analyticsAllowed
                        ? 'El checkout de Hotmart se abre en esta misma página.'
                        : 'El checkout se abre directamente en Hotmart en una pestaña nueva.'}
                      <ExternalLink
                        className="ml-1 inline size-3 opacity-60"
                        aria-hidden="true"
                      />
                    </p>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <style>{`
        /* ── Accordion panel animation ─────────────────────────────────── */
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

        /* ── Override Hotmart's default button styles so our design wins. ──
           The hotmart-fb class is required for the widget JS to intercept
           clicks, but we don't want Hotmart's visual styles applied.      */
        a.hotmart-fb.hotmart__button-checkout {
          all: unset !important;
          /* Re-apply our layout properties after unsetting */
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          margin-top: 0.625rem !important;
          min-height: 2.75rem !important;
          width: 100% !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.625rem !important;
          background-color: #10b981 !important;
          color: #fff !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          text-align: center !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: background-color 150ms, transform 150ms !important;
          box-sizing: border-box !important;
        }

        a.hotmart-fb.hotmart__button-checkout:hover {
          background-color: #059669 !important;
          transform: translateY(-1px) !important;
        }

        a.hotmart-fb.hotmart__button-checkout:active {
          transform: translateY(0) !important;
        }

        @media (prefers-color-scheme: dark) {
          a.hotmart-fb.hotmart__button-checkout {
            color: #030712 !important;
          }
        }
      `}</style>
    </>
  )
}
