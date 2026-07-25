import { getAuthUser } from '@/lib/supabase/server'
import { SocialLinksManager } from './social-links-manager'
import { PLAN_LIMITS, SOCIAL_PLATFORMS } from '@/types/database.types'

export const metadata = { title: 'Redes Sociales | Dashboard' }

export default async function SocialLinksPage() {
  const { user, supabase } = await getAuthUser()

  const [{ data: links }, { data: profile }] = await Promise.all([
    supabase.from('social_links').select('*').eq('profile_id', user!.id).order('order_index'),
    supabase.from('profiles').select('plan').eq('id', user!.id).single(),
  ])

  const plan = (profile?.plan as 'free' | 'pro' | 'organization') ?? 'free'
  const limit = PLAN_LIMITS[plan].socialLinks

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Redes Sociales</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Agrega los enlaces que aparecerán en tu perfil público.
          Plan <strong className="text-slate-700 dark:text-slate-300">{plan}</strong>: {links?.length ?? 0} / {limit} enlaces.
        </p>
      </div>
      <SocialLinksManager links={links ?? []} limit={limit} platforms={SOCIAL_PLATFORMS} />
    </div>
  )
}
