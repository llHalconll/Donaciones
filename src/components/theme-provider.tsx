'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasCookieCategoryConsent,
  type CookieConsentRecord,
} from '@/lib/cookie-consent'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  mounted: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  mounted: false,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  // null means "not yet read from DOM"
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // The inline script in layout.tsx already applied the correct class
    // before React hydrated — we just read the DOM truth here.
    const frame = requestAnimationFrame(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
      setMounted(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function syncThemeWithConsent(event: Event) {
      const consent = (event as CustomEvent<CookieConsentRecord>).detail
      if (consent.categories.preferences) return

      const shouldUseDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches
      document.documentElement.classList.toggle('dark', shouldUseDark)
      setTheme(shouldUseDark ? 'dark' : 'light')
    }

    window.addEventListener(
      COOKIE_CONSENT_CHANGED_EVENT,
      syncThemeWithConsent
    )
    return () =>
      window.removeEventListener(
        COOKIE_CONSENT_CHANGED_EVENT,
        syncThemeWithConsent
      )
  }, [])

  const toggleTheme = () => {
    // Read from DOM directly (source of truth) to avoid any stale-state inversion
    const currentlyDark = document.documentElement.classList.contains('dark')
    const nextTheme: Theme = currentlyDark ? 'light' : 'dark'

    setTheme(nextTheme)
    if (hasCookieCategoryConsent('preferences')) {
      localStorage.setItem('theme', nextTheme)
    } else {
      localStorage.removeItem('theme')
    }

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
