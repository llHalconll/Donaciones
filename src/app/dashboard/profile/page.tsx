import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import type { Profile } from '@/types/database.types'

export const metadata = {
  title: 'Editar perfil | Dashboard',
}

export default async function ProfileSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, banner_url, is_active, is_admin, created_at, updated_at')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Perfil del Creador</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personaliza la información pública que verán tus donantes en tu página.
        </p>
      </div>

      {user ? (
        <ProfileForm profile={profile} userId={user.id} />
      ) : (
        <p className="text-sm text-rose-500">No se pudo cargar el perfil. Por favor recarga la página.</p>
      )}
    </div>
  )
}
