import type { Metadata } from 'next'
import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'
import { getSupportEmail } from '@/lib/public-config'

export const metadata: Metadata = { title: 'Configuración | Dashboard' }

export default async function SettingsPage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/auth/login')
  const supportEmail = getSupportEmail()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Cuenta</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administra las credenciales y datos de acceso a tu cuenta.
        </p>
      </div>
      <SettingsForm userEmail={user.email} supportEmail={supportEmail} />
    </div>
  )
}
