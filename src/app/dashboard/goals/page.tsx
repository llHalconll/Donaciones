import { getAuthUser } from '@/lib/supabase/server'
import { GoalsManager } from './goals-manager'
import { PLAN_LIMITS, type PlanType } from '@/types/database.types'

export const metadata = { title: 'Objetivos de apoyo | Dashboard' }

export default async function SupportGoalsPage() {
  const { user, supabase } = await getAuthUser()

  const [{ data: goals }, { data: profile }] = await Promise.all([
    supabase
      .from('support_goals')
      .select('*, support_amounts(id)')
      .eq('profile_id', user!.id)
      .order('order_index'),
    supabase.from('profiles').select('plan').eq('id', user!.id).single(),
  ])

  const plan = (profile?.plan as PlanType) ?? 'free'
  const limit = PLAN_LIMITS[plan].goals
  const normalizedGoals = (goals ?? []).map((goal) => {
    const { support_amounts: supportAmounts, ...goalFields } = goal
    return {
      ...goalFields,
      amount_count: supportAmounts?.length ?? 0,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Objetivos de apoyo
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Agrupa una causa o propósito y añade dentro sus niveles con checkout
          propio. {normalizedGoals.length} de {limit} objetivos usados.
        </p>
      </div>
      <GoalsManager goals={normalizedGoals} limit={limit} />
    </div>
  )
}
