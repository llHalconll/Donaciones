// Server Component — puede exportar metadata
import type { Metadata } from 'next'
import { SettingsForm } from './settings-form'

export const metadata: Metadata = { title: 'Configuración | Dashboard' }

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Cuenta</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Administra las credenciales de acceso a tu cuenta.
        </p>
      </div>
      <SettingsForm />
    </div>
  )
}
