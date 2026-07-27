import type { PlanType } from '@/types/database.types'

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Plan gratuito',
  pro: 'Plan Pro',
  organization: 'Plan Organización',
}

export function formatSupportAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString('es-CO')}`
  }
}

export function isoDaysAgo(days: number, from = Date.now()) {
  return new Date(from - days * 24 * 60 * 60 * 1000).toISOString()
}
