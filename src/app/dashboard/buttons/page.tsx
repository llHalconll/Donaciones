import { createClient } from '@/lib/supabase/server'
import { ButtonsManager } from './buttons-manager'
import { PLAN_LIMITS } from '@/types/database.types'

export const metadata = { title: 'Montos de Apoyo | Dashboard' }

const PRESET_AMOUNTS = [5, 10, 15, 20, 30, 40, 50, 100, 200, 300]

export default async function DonationButtonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: buttons }, { data: profile }] = await Promise.all([
    supabase
      .from('donation_buttons')
      .select('*')
      .eq('profile_id', user!.id)
      .order('order_index'),
    supabase.from('profiles').select('plan').eq('id', user!.id).single(),
  ])

  const plan = (profile?.plan as 'free' | 'pro' | 'organization') ?? 'free'
  const limit = PLAN_LIMITS[plan].buttons

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Montos de Apoyo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configura los montos y asigna un enlace de Hotmart a cada uno.
          Plan <strong className="text-slate-700 dark:text-slate-300">{plan}</strong>:{' '}
          {buttons?.length ?? 0} / {limit} botones.
        </p>
      </div>
      <ButtonsManager
        buttons={buttons ?? []}
        limit={limit}
        presetAmounts={PRESET_AMOUNTS}
      />
    </div>
  )
}
