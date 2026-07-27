'use client'

import { useActionState } from 'react'
import { KeyRound, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { resetPasswordAction } from '../actions'
import { BrandLink } from '@/components/shared/brand-link'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLink size="lg" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Establecer Nueva Contraseña</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa y confirma tu nueva contraseña para actualizar el acceso.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-center">Nueva Contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div role="alert" className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {state.error}
                </div>
              )}

              <Input
                label="Nueva Contraseña"
                name="password"
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
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                required
                minLength={8}
              />

              <Button variant="primary" type="submit" isLoading={isPending} className="w-full">
                <KeyRound className="w-4 h-4 mr-1" />
                Actualizar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
