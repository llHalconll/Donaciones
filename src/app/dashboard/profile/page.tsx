import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'

export const metadata = { title: 'Mi Perfil | Dashboard' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, banner_url, account_type, website_url, plan, is_active, is_admin, created_at, updated_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personaliza cómo te ven tus visitantes en{' '}
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            /{profile?.username ?? '...'}
          </span>
        </p>
      </div>

      <ProfileForm profile={profile} userId={user.id} />
    </div>
  )
}
