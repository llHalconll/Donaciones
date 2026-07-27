'use client'

import { useEffect } from 'react'
import { trackPublicEvent } from '@/lib/analytics/public-client'

interface Props {
  profileId: string
}

export function ProfileViewTracker({ profileId }: Props) {
  useEffect(() => {
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
  }, [profileId])

  return null
}
