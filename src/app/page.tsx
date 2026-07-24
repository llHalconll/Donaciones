import Link from 'next/link'
import { PublicHeader } from '@/components/shared/header'
import { PublicFooter } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, Zap, Globe, DollarSign } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-500/10 via-indigo-500/10 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2">
              <Badge variant="emerald" className="py-1 px-3 text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Infraestructura SaaS para Creadores
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Tu perfil público de donaciones <br className="hidden sm:inline" />
              vinculado a <span className="text-emerald-500">Hotmart</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Comparte una sola URL como <code className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-sm">midominio.com/tu_nombre</code>, añade botones de aportes fijos y permite que tu audiencia te apoye sin complicaciones.
            </p>

            {/* Input Simulator / CTA */}
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full flex items-center px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-sm text-slate-500 dark:text-slate-400">
                <span className="font-mono text-xs text-slate-400">donaciones.com/</span>
                <input
                  type="text"
                  placeholder="tu_usuario"
                  readOnly
                  className="w-full bg-transparent font-medium text-slate-900 dark:text-white focus:outline-none cursor-default"
                />
              </div>

              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full whitespace-nowrap">
                  Reclamar URL
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Quick Demo Link */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>¿Quieres ver cómo luce un perfil?</span>
              <Link href="/demo" className="text-emerald-500 font-semibold hover:underline flex items-center gap-1">
                Ver Demo (@demo)
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <Badge variant="indigo">Ventajas Principales</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Diseñado para simplificar tus ingresos como creador
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-3 hover:border-emerald-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configuración en 2 minutos</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Crea tu cuenta, añade tu avatar, banner, redes sociales y tus montos de donación sin tocar código.
                </p>
              </Card>

              <Card className="p-6 space-y-3 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Checkout Directo a Hotmart</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cada botón redirige a la URL de checkout que tú elijas en Hotmart, garantizando seguridad en los cobros.
                </p>
              </Card>

              <Card className="p-6 space-y-3 hover:border-emerald-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfil Limpio & Adaptable</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Totalmente optimizado para dispositivos móviles, modo claro y modo oscuro para tus seguidores.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
