import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuthUser } from '@/lib/supabase/server'
import { buttonStyles } from '@/components/ui/button'
import { GoalLevelsManager } from './goal-levels-manager'
import { MAX_SUPPORT_AMOUNTS_PER_GOAL } from '@/types/database.types'

interface Props {
  params: Promise<{ goalId: string }>
}

export default async function SupportGoalLevelsPage({ params }: Props) {
  const { goalId } = await params
  const { user, supabase } = await getAuthUser()

  const [{ data: goal }, { data: amounts }] = await Promise.all([
    supabase
      .from('support_goals')
      .select('*')
      .eq('id', goalId)
      .eq('profile_id', user!.id)
      .maybeSingle(),
    supabase
      .from('support_amounts')
      .select('*')
      .eq('goal_id', goalId)
      .order('order_index'),
  ])

  if (!goal) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/goals"
        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a objetivos
      </Link>

      <div>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {goal.emoji || '♥'} Objetivo
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-slate-900 dark:text-white">
          {goal.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cada nivel abre exclusivamente su checkout configurado en Hotmart.
        </p>
      </div>

      <GoalLevelsManager
        goal={goal}
        amounts={amounts ?? []}
        limit={MAX_SUPPORT_AMOUNTS_PER_GOAL}
      />
    </div>
  )
}
