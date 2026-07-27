import type {
  SupportAmount,
  SupportGoal,
} from '@/types/database.types'
import { validateHotmartUrl } from '@/lib/validations/url'
import { formatSupportAmount } from '@/lib/presentation'

export const INITIAL_VISIBLE_SUPPORT_AMOUNTS = 8

export type PublicSupportAmount = Pick<
  SupportAmount,
  | 'id'
  | 'goal_id'
  | 'amount'
  | 'currency'
  | 'hotmart_checkout_url'
  | 'hotmart_offer_code'
  | 'button_label'
  | 'is_featured'
  | 'order_index'
>

export type PublicSupportGoal = Pick<
  SupportGoal,
  | 'id'
  | 'emoji'
  | 'title'
  | 'description'
  | 'cover_url'
  | 'order_index'
> & {
  amounts: PublicSupportAmount[]
}

export type OrderedItem = { id: string; order_index: number }
export type MoveDirection = 'up' | 'down'

export function isSupportAmountAvailable(amount: PublicSupportAmount) {
  const numericAmount = Number(amount.amount)
  return (
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    validateHotmartUrl(amount.hotmart_checkout_url).ok
  )
}

export function getFeaturedSupportAmountId(amounts: PublicSupportAmount[]) {
  return amounts.find(
    (amount) => amount.is_featured && isSupportAmountAvailable(amount)
  )?.id ?? null
}

export function getInitialSupportAmountId(amounts: PublicSupportAmount[]) {
  return (
    getFeaturedSupportAmountId(amounts) ??
    amounts.find((amount) => isSupportAmountAvailable(amount))?.id ??
    null
  )
}

export function getSelectedSupportAmount(
  amounts: PublicSupportAmount[],
  selectedId: string | null
) {
  return (
    amounts.find(
      (amount) =>
        amount.id === selectedId && isSupportAmountAvailable(amount)
    ) ?? null
  )
}

export function getVisibleSupportAmounts(
  amounts: PublicSupportAmount[],
  selectedId: string | null,
  expanded: boolean,
  limit = INITIAL_VISIBLE_SUPPORT_AMOUNTS
) {
  if (expanded || amounts.length <= limit) return amounts

  const prioritizedIds = [
    selectedId,
    getFeaturedSupportAmountId(amounts),
    ...amounts.map((amount) => amount.id),
  ].filter((id): id is string => Boolean(id))

  return [...new Set(prioritizedIds)]
    .map((id) => amounts.find((amount) => amount.id === id))
    .filter((amount): amount is PublicSupportAmount => Boolean(amount))
    .slice(0, limit)
}

export function canStartSupportCheckout({
  locked,
  amount,
  checkoutUrl,
}: {
  locked: boolean
  amount: PublicSupportAmount | null
  checkoutUrl: string | null
}) {
  return !locked && Boolean(amount && checkoutUrl)
}

export function getSupportCtaLabel(amount: PublicSupportAmount | null) {
  if (!amount) return 'Selecciona un nivel de apoyo'

  return `Apoyar con ${formatSupportAmount(
    Number(amount.amount),
    amount.currency
  )}`
}

export function getSupportEmptyStateCopy(
  creatorName: string,
  hasPublicLinks: boolean
) {
  if (hasPublicLinks) {
    return {
      title: 'Este perfil todavía no recibe apoyos',
      description: `Puedes conocer mejor el trabajo de ${creatorName} en sus enlaces públicos y volver más adelante.`,
    }
  }

  return {
    title: `${creatorName} está preparando su página`,
    description: 'Vuelve más adelante para conocer nuevas formas de apoyarlo.',
  }
}

export function moveOrderedItem<T extends OrderedItem>(
  items: T[],
  id: string,
  direction: MoveDirection
) {
  const currentIndex = items.findIndex((item) => item.id === id)
  if (currentIndex < 0) return items

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= items.length) return items

  const next = [...items]
  ;[next[currentIndex], next[targetIndex]] = [
    next[targetIndex],
    next[currentIndex],
  ]

  return next.map((item, orderIndex) => ({
    ...item,
    order_index: orderIndex,
  }))
}
