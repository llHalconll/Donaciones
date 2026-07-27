const HOTMART_OFFER_CODE_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export interface HotmartOfferCodeValidationResult {
  ok: boolean
  error?: string
  normalizedCode?: string
}

export function validateHotmartOfferCode(
  raw: string | null | undefined
): HotmartOfferCodeValidationResult {
  const normalizedCode = raw?.trim() ?? ''

  if (!normalizedCode) {
    return { ok: true }
  }

  if (!HOTMART_OFFER_CODE_PATTERN.test(normalizedCode)) {
    return {
      ok: false,
      error:
        'El código de oferta de Hotmart solo puede contener letras, números, guion y guion bajo.',
    }
  }

  return { ok: true, normalizedCode }
}
