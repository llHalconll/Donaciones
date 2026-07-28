'use client'

import { useEffect } from 'react'
import { useCookieConsent } from '@/components/cookies/cookie-consent-provider'
import { trackPublicEvent } from '@/lib/analytics/public-client'

interface Props {
  profileId: string
}

export function ProfileViewTracker({ profileId }: Props) {
  const { hasConsent } = useCookieConsent()
  const analyticsAllowed = hasConsent('analytics')

  useEffect(() => {
    if (!analyticsAllowed) return

    const viewKey = `dsaas_profile_view:${profileId}:${window.location.pathname}`

    try {
      if (sessionStorage.getItem(viewKey)) return
      sessionStorage.setItem(viewKey, '1')
    } catch {
      // Tracking can continue without session-level deduplication.
    }

    void trackPublicEvent({
      profileId,
      eventType: 'profile_view',
      keepalive: true,
    })
  }, [analyticsAllowed, profileId])

  return null
}
