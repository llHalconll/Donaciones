'use client'

import { useActionState, useState } from 'react'
import { KeyRound, Mail, UserRoundX, AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePasswordAction, updateEmailAction, deactivateProfileAction } from './actions'

export function SettingsForm({
  userEmail,
  supportEmail,
}: {
  userEmail?: string
  supportEmail: string | null
}) {
  const [pwState, pwAction, pwPending] = useActionState(updatePasswordAction, null)
  const [emailState, emailAction, emailPending] = useActionState(updateEmailAction, null)
  const [deactivateState, deactivateAction, deactivatePending] = useActionState(deactivateProfileAction, null)
  const [showDeactivate, setShowDeactivate] = useState(false)

  return (
    <div className="space-y-6">
      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-500" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={pwAction} className="space-y-4 max-w-md">
            {pwState?.error && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {pwState.error}
              </div>
            )}
            {pwState?.success && (
              <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {pwState.success}
              </div>
            )}
            <Input label="Nueva Contraseña" name="newPassword" type="password"
              placeholder="Mínimo 8 caracteres" autoComplete="new-password" required minLength={8} />
            <Input label="Confirmar Nueva Contraseña" name="confirmPassword" type="password"
              placeholder="Repite tu nueva contraseña" autoComplete="new-password" required minLength={8} />
            <Button type="submit" variant="primary" size="sm" isLoading={pwPending}>
              Actualizar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500" />
            Cambiar Correo Electrónico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userEmail && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Correo actual: <strong className="text-slate-700 dark:text-slate-300">{userEmail}</strong>
            </p>
          )}
          <form action={emailAction} className="space-y-4 max-w-md">
            {emailState?.error && (
              <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {emailState.error}
              </div>
            )}
            {emailState?.success && (
              <div role="status" className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {emailState.success}
              </div>
            )}
            <Input label="Nuevo Correo Electrónico" name="newEmail" type="email"
              placeholder="nuevo@ejemplo.com" autoComplete="email" required />
            <Input label="Confirmar Nuevo Correo" name="confirmEmail" type="email"
              placeholder="nuevo@ejemplo.com" autoComplete="email" required />
            <p className="text-xs text-slate-400">
              Recibirás un correo de confirmación en ambas direcciones. El cambio se aplicará después de confirmar.
            </p>
            <Button type="submit" variant="outline" size="sm" isLoading={emailPending}>
              Solicitar cambio de correo
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Deactivate public profile */}
      <Card className="border-amber-200 dark:border-amber-900/50">
        <CardHeader>
          <button
            type="button"
            onClick={() => setShowDeactivate((p) => !p)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <UserRoundX className="w-4 h-4" />
              Desactivar perfil público
            </CardTitle>
            {showDeactivate ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </CardHeader>
        {showDeactivate && (
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Esta acción no elimina tu cuenta ni tus datos.</p>
                  <p className="text-xs">
                    Tu perfil público se ocultará y se cerrará tu sesión. Podrás volver a iniciar sesión.{' '}
                    {supportEmail
                      ? `Para la eliminación definitiva de datos, contáctanos a ${supportEmail}.`
                      : 'El canal para solicitar la eliminación definitiva todavía no está configurado.'}
                  </p>
                </div>
              </div>
              <form action={deactivateAction} className="space-y-4">
                {deactivateState?.error && (
                  <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {deactivateState.error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="confirmDeactivate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Escribe <strong>DESACTIVAR</strong> para confirmar
                  </label>
                  <input
                    id="confirmDeactivate"
                    name="confirmation"
                    type="text"
                    required
                    placeholder="DESACTIVAR"
                    autoComplete="off"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" isLoading={deactivatePending}
                  className="bg-amber-600 hover:bg-amber-700">
                  <UserRoundX className="w-4 h-4" />
                  Desactivar mi perfil
                </Button>
              </form>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
