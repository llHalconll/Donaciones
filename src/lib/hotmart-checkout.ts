import { validateHotmartOfferCode } from '@/lib/validations/hotmart'
import { validateHotmartUrl } from '@/lib/validations/url'

export const HOTMART_CHECKOUT_ELEMENTS_SRC =
  'https://checkout.hotmart.com/lib/hotmart-checkout-elements.js'

export type HotmartScriptStatus = 'loading' | 'ready' | 'error'

export interface HotmartCheckoutAmount {
  id: string
  hotmart_checkout_url: string
  hotmart_offer_code: string | null
}

export interface HotmartOverlayInstance {
  attach(selector: string): void
}

export interface HotmartCheckoutElementsApi {
  init(
    mode: 'overlayCheckout',
    options: { offer: string }
  ): HotmartOverlayInstance
}

export type HotmartCheckoutPresentation =
  | {
      kind: 'unavailable'
      checkoutUrl: null
      offerCode: null
    }
  | {
      kind: 'fallback'
      checkoutUrl: string
      offerCode: string | null
    }
  | {
      kind: 'loading'
      checkoutUrl: string
      offerCode: string
    }
  | {
      kind: 'overlay'
      checkoutUrl: string
      offerCode: string
    }

export function getHotmartCheckoutUrl(
  amount: HotmartCheckoutAmount | null
) {
  if (!amount) return null

  const result = validateHotmartUrl(amount.hotmart_checkout_url)
  return result.ok ? result.normalizedUrl ?? null : null
}

export function getHotmartOfferCode(
  amount: HotmartCheckoutAmount | null
) {
  if (!amount) return null

  const result = validateHotmartOfferCode(amount.hotmart_offer_code)
  return result.ok ? result.normalizedCode ?? null : null
}

export function getHotmartCheckoutPresentation({
  amount,
  scriptStatus,
  attachedAmountId,
  failedAmountIds,
}: {
  amount: HotmartCheckoutAmount | null
  scriptStatus: HotmartScriptStatus
  attachedAmountId: string | null
  failedAmountIds: ReadonlySet<string>
}): HotmartCheckoutPresentation {
  const checkoutUrl = getHotmartCheckoutUrl(amount)
  if (!amount || !checkoutUrl) {
    return { kind: 'unavailable', checkoutUrl: null, offerCode: null }
  }

  const offerCode = getHotmartOfferCode(amount)
  if (
    !offerCode ||
    scriptStatus === 'error' ||
    failedAmountIds.has(amount.id)
  ) {
    return { kind: 'fallback', checkoutUrl, offerCode }
  }

  if (scriptStatus !== 'ready' || attachedAmountId !== amount.id) {
    return { kind: 'loading', checkoutUrl, offerCode }
  }

  return { kind: 'overlay', checkoutUrl, offerCode }
}

export function attachHotmartOverlay({
  api,
  selector,
  offerCode,
}: {
  api: HotmartCheckoutElementsApi
  selector: string
  offerCode: string
}) {
  const instance = api.init('overlayCheckout', { offer: offerCode })
  instance.attach(selector)
  return instance
}
