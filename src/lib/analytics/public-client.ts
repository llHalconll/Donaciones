'use client'

import type { EventType } from '@/types/database.types'
import { hasCookieCategoryConsent } from '@/lib/cookie-consent'

const SESSION_ID_KEY = 'dsaas_session'

export function getOrCreatePublicSessionId() {
  if (typeof window === 'undefined') return null
  if (!hasCookieCategoryConsent('analytics')) return null

  let id = sessionStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    const randomId =
      globalThis.crypto?.randomUUID?.() ??
      `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
    id = randomId
    sessionStorage.setItem(SESSION_ID_KEY, id)
  }

  return id
}

interface TrackPublicEventInput {
  profileId: string
  eventType: EventType
  supportAmountId?: string
  keepalive?: boolean
}

export async function trackPublicEvent({
  profileId,
  eventType,
  supportAmountId,
  keepalive = false,
}: TrackPublicEventInput) {
  if (!hasCookieCategoryConsent('analytics')) return

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive,
      body: JSON.stringify({
        profile_id: profileId,
        support_amount_id: supportAmountId ?? null,
        event_type: eventType,
        session_id: getOrCreatePublicSessionId(),
        referrer: document.referrer ? document.referrer.slice(0, 200) : null,
      }),
    })
  } catch {
    // Analytics must never block or interrupt the public support flow.
  }
}
