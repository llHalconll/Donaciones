import { validateHotmartOfferCode } from '@/lib/validations/hotmart'
import { validateHotmartUrl } from '@/lib/validations/url'

export const HOTMART_CHECKOUT_ELEMENTS_SRC =
  'https://checkout.hotmart.com/lib/hotmart-checkout-elements.js'

/**
 * Official Hotmart widget script that intercepts clicks on elements with
 * class "hotmart-fb hotmart__button-checkout" and opens the checkout as
 * a popup overlay (checkoutMode=2) without navigating away from the page.
 */
export const HOTMART_WIDGET_SCRIPT_SRC =
  'https://static.hotmart.com/checkout/widget.min.js'


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
    mode: 'overlayCheckout' | 'inlineCheckout',
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

/**
 * Returns the canonical checkout URL combining the stored URL and the offer
 * code. If an offer code is provided it is appended as `?off={code}`,
 * replacing any existing `off` parameter so the result is always canonical.
 *
 * This lets creators enter a plain base URL like:
 *   https://pay.hotmart.com/B106880282V
 * and a separate offer code like:
 *   y058gaqy
 * and the system automatically constructs:
 *   https://pay.hotmart.com/B106880282V?off=y058gaqy
 */
export function getEffectiveCheckoutUrl(
  amount: HotmartCheckoutAmount | null
): string | null {
  const rawUrl = getHotmartCheckoutUrl(amount)
  if (!rawUrl) return null

  const offerCode = getHotmartOfferCode(amount)
  if (!offerCode) return rawUrl

  try {
    const url = new URL(rawUrl)
    // Always set the canonical `off` param from the explicit offer code field,
    // replacing any value the user may have embedded in the URL itself.
    url.searchParams.set('off', offerCode)
    return url.toString()
  } catch {
    return rawUrl
  }
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
  // Use getEffectiveCheckoutUrl so the offer code is always appended to the
  // base URL — even if the creator entered the URL and code in separate fields.
  const checkoutUrl = getEffectiveCheckoutUrl(amount)
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

/**
 * Renders a Hotmart checkout inline inside a DOM container we control.
 * Use this instead of attachHotmartOverlay when you want to show the
 * checkout inside your own modal rather than Hotmart's full-screen overlay.
 */
export function attachHotmartInline({
  api,
  containerSelector,
  offerCode,
}: {
  api: HotmartCheckoutElementsApi
  containerSelector: string
  offerCode: string
}): HotmartOverlayInstance {
  const instance = api.init('inlineCheckout', { offer: offerCode })
  instance.attach(containerSelector)
  return instance
}

/**
 * Returns the checkout URL for Hotmart's official popup widget.
 *
 * Appends `?checkoutMode=2` so the Hotmart widget script opens the checkout
 * as a popup overlay without navigating away from the page.
 * Also includes `?off={offerCode}` when an explicit offer code is present.
 *
 * Usage: set `href` on an `<a class="hotmart-fb hotmart__button-checkout">`.
 * The widget.min.js script intercepts the click and opens the popup.
 * If the script hasn't loaded yet the link opens the checkout in a new tab.
 */
export function getHotmartWidgetUrl(
  amount: HotmartCheckoutAmount | null
): string | null {
  // getEffectiveCheckoutUrl already merges the base URL + offer code.
  const baseUrl = getEffectiveCheckoutUrl(amount)
  if (!baseUrl) return null

  try {
    const url = new URL(baseUrl)
    url.searchParams.set('checkoutMode', '2')
    return url.toString()
  } catch {
    return baseUrl
  }
}
