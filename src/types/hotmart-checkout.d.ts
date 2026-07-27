import type { HotmartCheckoutElementsApi } from '@/lib/hotmart-checkout'

declare global {
  interface Window {
    checkoutElements?: HotmartCheckoutElementsApi
  }
}

export {}
