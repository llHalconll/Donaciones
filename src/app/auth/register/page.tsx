'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { GoogleButton } from '@/components/ui/google-button'
import { registerAction } from '../actions'
import { BrandLink } from '@/components/shared/brand-link'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLink size="lg" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crea tu cuenta de creador</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reclama tu URL única y empieza a recibir donaciones directas a Hotmart.
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-center">Registro de Creador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth — fastest path */}
            <GoogleButton label="Registrarse con Google" />

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              <span className="text-xs text-slate-400 font-medium">o con correo</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Email form */}
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
                  {state.error}
                </div>
              )}

              <Input
                label="Nombre o Seudónimo"
                name="displayName"
                type="text"
                placeholder="Ej. Alex Creator"
                required
              />
              <Input
                label="Usuario público"
                name="username"
                type="text"
                prefixText="@"
                placeholder="alex"
                required
              />
              <Input
                label="Correo Electrónico"
                name="email"
                type="email"
                placeholder="tu@ejemplo.com"
                required
              />
              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
              />

              <div className="space-y-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Perfil público personalizable</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Sin intermediación en el cobro de Hotmart</span>
                </div>
              </div>

              <Button variant="primary" type="submit" isLoading={isPending} className="w-full">
                Crear Mi Cuenta Gratis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800/60 pt-4 text-xs text-slate-500 dark:text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
