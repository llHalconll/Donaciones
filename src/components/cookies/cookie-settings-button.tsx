'use client'

import { OPEN_COOKIE_SETTINGS_EVENT } from '@/lib/cookie-consent'

interface CookieSettingsButtonProps {
  className?: string
}

export function CookieSettingsButton({
  className,
}: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className={className}
    >
      Configurar cookies
    </button>
  )
}
