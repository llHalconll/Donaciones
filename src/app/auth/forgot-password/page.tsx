'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { forgotPasswordAction } from '../actions'
import { BrandLink } from '@/components/shared/brand-link'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLink size="lg" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperar Contraseña</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa tu correo para recibir un enlace de restablecimiento.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-center">Restablecer acceso</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
                  {state.error}
                </div>
              )}

              {state?.success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
                  {state.success}
                </div>
              )}

              <Input
                label="Correo Electrónico Registrado"
                name="email"
                type="email"
                placeholder="tu@ejemplo.com"
                required
              />

              <Button variant="primary" type="submit" isLoading={isPending} className="w-full">
                Enviar Enlace de Recuperación
                <Send className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800/60 pt-4 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Inicio de Sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
