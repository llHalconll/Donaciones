'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { GoogleButton } from '@/components/ui/google-button'
import { loginAction } from '../actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Heart className="w-5 h-5 fill-emerald-500/20" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Donaciones<span className="text-emerald-500">SaaS</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bienvenido de nuevo</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa a tu panel de creador para gestionar tus enlaces de Hotmart.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-center">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth */}
            <GoogleButton label="Continuar con Google" />

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              <span className="text-xs text-slate-400 font-medium">o con correo</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Email + password form */}
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
                  {state.error}
                </div>
              )}

              <Input
                label="Correo Electrónico"
                name="email"
                type="email"
                placeholder="tu@ejemplo.com"
                autoComplete="email"
                required
              />
              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-end text-xs">
                <Link
                  href="/auth/forgot-password"
                  className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button variant="primary" type="submit" isLoading={isPending} className="w-full">
                Acceder al Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 dark:border-slate-800/60 pt-4 text-xs text-slate-500 dark:text-slate-400">
            ¿Aún no tienes una cuenta?{' '}
            <Link href="/auth/register" className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
