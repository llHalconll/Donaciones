import type { DonationButton } from '@/types/database.types'
import { validateHotmartUrl } from '@/lib/validations/url'
import { formatSupportAmount } from '@/lib/presentation'

export const INITIAL_VISIBLE_SUPPORT_OPTIONS = 4

export type PublicSupportOption = Pick<
  DonationButton,
  | 'id'
  | 'title'
  | 'emoji'
  | 'description'
  | 'amount'
  | 'currency'
  | 'hotmart_checkout_url'
  | 'button_label'
  | 'is_featured'
>

export type OrderedSupportOption = Pick<DonationButton, 'id' | 'order_index'>
export type MoveDirection = 'up' | 'down'

export function isSupportOptionAvailable(option: PublicSupportOption) {
  const amount = Number(option.amount)
  return (
    Number.isFinite(amount) &&
    amount > 0 &&
    validateHotmartUrl(option.hotmart_checkout_url).ok
  )
}

export function getFeaturedSupportOptionId(options: PublicSupportOption[]) {
  return options.find((option) => option.is_featured)?.id ?? null
}

export function getInitialSupportOptionId(options: PublicSupportOption[]) {
  const featuredId = getFeaturedSupportOptionId(options)
  const featured = options.find(
    (option) => option.id === featuredId && isSupportOptionAvailable(option)
  )

  return (
    featured?.id ??
    options.find((option) => isSupportOptionAvailable(option))?.id ??
    null
  )
}

export function getSelectedSupportOption(
  options: PublicSupportOption[],
  selectedId: string | null
) {
  return (
    options.find(
      (option) =>
        option.id === selectedId && isSupportOptionAvailable(option)
    ) ?? null
  )
}

export function getVisibleSupportOptions(
  options: PublicSupportOption[],
  selectedId: string | null,
  expanded: boolean,
  limit = INITIAL_VISIBLE_SUPPORT_OPTIONS
) {
  if (expanded || options.length <= limit) return options

  const prioritizedIds = [
    selectedId,
    getFeaturedSupportOptionId(options),
    ...options.map((option) => option.id),
  ].filter((id): id is string => Boolean(id))

  const uniqueIds = [...new Set(prioritizedIds)]
  return uniqueIds
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is PublicSupportOption => Boolean(option))
    .slice(0, limit)
}

export function buildHotmartWidgetUrl(option: PublicSupportOption | null) {
  if (!option || !isSupportOptionAvailable(option)) return null

  const result = validateHotmartUrl(option.hotmart_checkout_url)
  if (!result.ok || !result.normalizedUrl) return null

  const parsed = new URL(result.normalizedUrl)
  parsed.searchParams.set('checkoutMode', '2')
  return parsed.toString()
}

export function canStartSupportRedirect({
  locked,
  option,
  checkoutUrl,
}: {
  locked: boolean
  option: PublicSupportOption | null
  checkoutUrl: string | null
}) {
  return !locked && Boolean(option && checkoutUrl)
}

export function getSupportCtaLabel(option: PublicSupportOption | null) {
  if (!option) return 'Selecciona una opción de apoyo'

  return `Apoyar con ${formatSupportAmount(
    Number(option.amount),
    option.currency
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

export function moveOrderedSupportOption<T extends OrderedSupportOption>(
  options: T[],
  id: string,
  direction: MoveDirection
) {
  const currentIndex = options.findIndex((option) => option.id === id)
  if (currentIndex < 0) return options

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= options.length) return options

  const next = [...options]
  ;[next[currentIndex], next[targetIndex]] = [
    next[targetIndex],
    next[currentIndex],
  ]

  return next.map((option, orderIndex) => ({
    ...option,
    order_index: orderIndex,
  }))
}
