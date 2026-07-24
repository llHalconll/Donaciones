import Link from 'next/link'
import { PublicHeader } from '@/components/shared/header'
import { PublicFooter } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, ArrowRight, Zap, Globe, DollarSign,
  CheckCircle2, Star, Users, BarChart2,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-500/10 via-indigo-500/10 to-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2">
              <Badge variant="emerald" className="py-1 px-3 text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Infraestructura SaaS para Creadores
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Tu perfil de donaciones <br className="hidden sm:inline" />
              vinculado a <span className="text-emerald-500">Hotmart</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Comparte una sola URL como{' '}
              <code className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                midominio.com/tu_nombre
              </code>
              , añade botones de aportes fijos y permite que tu audiencia te apoye sin complicaciones.
            </p>

            {/* CTA */}
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full whitespace-nowrap">
                  Crear mi perfil gratis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full whitespace-nowrap">
                  Ver demo
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-400">Sin tarjeta de crédito. Sin comisiones. 100% gratis para empezar.</p>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-10 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Users, value: '100%', label: 'Gratis para empezar' },
                { icon: DollarSign, value: '0%', label: 'Comisión por donación' },
                { icon: BarChart2, value: '30d', label: 'Analytics incluidos' },
                { icon: Star, value: '5 min', label: 'Tiempo de setup' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="space-y-1">
                  <Icon className="w-5 h-5 text-emerald-500 mx-auto" />
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configuración en 5 minutos</h3>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfil Limpio &amp; Adaptable</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Totalmente optimizado para móvil, modo claro y oscuro. Tu audiencia lo verá perfecto en cualquier dispositivo.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* PLAN CTA */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <Badge variant="emerald">Planes disponibles</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Empieza gratis, escala cuando necesites
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              El plan gratuito incluye todo lo que necesitas para empezar. Los planes Pro y Organización desbloquean más botones, redes sociales y funciones avanzadas.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  Ver planes y precios
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" size="lg">Empezar gratis</Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 pt-2">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sin tarjeta de crédito</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sin comisiones</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancela cuando quieras</span>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
