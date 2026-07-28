export const COOKIE_POLICY_VERSION = '2026-07-28-draft-1'
export const COOKIE_CONSENT_STORAGE_KEY = 'dsaas_cookie_consent'
export const COOKIE_CONSENT_CHANGED_EVENT = 'dsaas:cookie-consent-changed'
export const OPEN_COOKIE_SETTINGS_EVENT = 'dsaas:open-cookie-settings'

export const COOKIE_CONSENT_DURATION_DAYS = 365

export type OptionalCookieCategory = 'preferences' | 'analytics'

export interface CookieCategories {
  necessary: true
  preferences: boolean
  analytics: boolean
}

export type CookieConsentMethod =
  | 'banner_accept_all'
  | 'banner_reject_nonessential'
  | 'preferences_save'
  | 'footer_preferences'

export interface CookieConsentRecord {
  version: string
  categories: CookieCategories
  method: CookieConsentMethod
  recordedAt: string
  expiresAt: string
}

const VALID_METHODS: ReadonlySet<CookieConsentMethod> = new Set([
  'banner_accept_all',
  'banner_reject_nonessential',
  'preferences_save',
  'footer_preferences',
])

export function parseCookieConsent(
  rawValue: string | null
): CookieConsentRecord | null {
  if (!rawValue) return null

  try {
    const parsed: unknown = JSON.parse(rawValue)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    const value = parsed as Record<string, unknown>
    const categories = value.categories
    if (
      value.version !== COOKIE_POLICY_VERSION ||
      typeof value.recordedAt !== 'string' ||
      typeof value.expiresAt !== 'string' ||
      !VALID_METHODS.has(value.method as CookieConsentMethod) ||
      !categories ||
      typeof categories !== 'object' ||
      Array.isArray(categories)
    ) {
      return null
    }

    const categoryValue = categories as Record<string, unknown>
    if (
      categoryValue.necessary !== true ||
      typeof categoryValue.preferences !== 'boolean' ||
      typeof categoryValue.analytics !== 'boolean'
    ) {
      return null
    }

    const recordedAt = Date.parse(value.recordedAt)
    const expiresAt = Date.parse(value.expiresAt)
    if (
      !Number.isFinite(recordedAt) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return null
    }

    return {
      version: COOKIE_POLICY_VERSION,
      categories: {
        necessary: true,
        preferences: categoryValue.preferences,
        analytics: categoryValue.analytics,
      },
      method: value.method as CookieConsentMethod,
      recordedAt: value.recordedAt,
      expiresAt: value.expiresAt,
    }
  } catch {
    return null
  }
}

export function getStoredCookieConsent() {
  if (typeof window === 'undefined') return null

  try {
    const rawValue = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    const consent = parseCookieConsent(rawValue)
    if (!consent && rawValue) {
      localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
    }
    return consent
  } catch {
    return null
  }
}

export function hasCookieCategoryConsent(
  category: OptionalCookieCategory
) {
  return getStoredCookieConsent()?.categories[category] === true
}

export function clearDeclinedBrowserStorage(categories: CookieCategories) {
  if (typeof window === 'undefined') return

  try {
    if (!categories.preferences) {
      localStorage.removeItem('theme')
    }

    if (!categories.analytics) {
      sessionStorage.removeItem('dsaas_session')
      for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = sessionStorage.key(index)
        if (key?.startsWith('dsaas_profile_view:')) {
          sessionStorage.removeItem(key)
        }
      }
    }
  } catch {
    // Storage may be unavailable in hardened browser modes.
  }
}
