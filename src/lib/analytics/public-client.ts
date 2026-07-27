'use client'

import type { EventType } from '@/types/database.types'

const SESSION_ID_KEY = 'dsaas_session'

export function getOrCreatePublicSessionId() {
  if (typeof window === 'undefined') return null

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
  buttonId?: string
  keepalive?: boolean
}

export async function trackPublicEvent({
  profileId,
  eventType,
  buttonId,
  keepalive = false,
}: TrackPublicEventInput) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive,
      body: JSON.stringify({
        profile_id: profileId,
        donation_button_id: buttonId ?? null,
        event_type: eventType,
        session_id: getOrCreatePublicSessionId(),
        referrer: document.referrer ? document.referrer.slice(0, 200) : null,
      }),
    })
  } catch {
    // Analytics must never block or interrupt the public support flow.
  }
}
