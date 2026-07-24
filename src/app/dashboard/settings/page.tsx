import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export const metadata: Metadata = { title: 'Configuraci\u00f3n | Dashboard' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuraci\u00f3n de Cuenta</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administra las credenciales y datos de acceso a tu cuenta.
        </p>
      </div>
      <SettingsForm userEmail={user.email} />
    </div>
  )
}
