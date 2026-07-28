export const TERMS_VERSION = '2026-07-28-draft-1'
export const PRIVACY_VERSION = '2026-07-28-draft-1'

export const PENDING_LEGAL_CONSENT_COOKIE = 'dsaas_pending_legal_consent'

export function getPendingLegalConsentValue() {
  return `${TERMS_VERSION}|${PRIVACY_VERSION}`
}
