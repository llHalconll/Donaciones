'use client'

import { useActionState } from 'react'
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePasswordAction } from './actions'

export function SettingsForm() {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-500" />
          Cambiar Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4 max-w-md">
          {state?.error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {state.error}
            </div>
          )}
          {state?.success && (
            <div
              role="status"
              className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {state.success}
            </div>
          )}

          <Input
            label="Nueva Contraseña"
            name="newPassword"
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Input
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            type="password"
            placeholder="Repite tu nueva contraseña"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
            Actualizar Contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
