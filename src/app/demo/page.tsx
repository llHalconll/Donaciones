import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  Globe, Camera, Video, MessageSquare, Heart,
  Star, ExternalLink, ArrowLeft, Flag, Share2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Demo — Perfil de Creador | DonacionesSaaS',
  description: 'Así luce un perfil público real creado con DonacionesSaaS. Personaliza el tuyo gratis.',
  openGraph: {
    title: 'Demo — Perfil de Creador',
    description: 'Así luce un perfil público real en DonacionesSaaS.',
  },
}

const DEMO_BUTTONS = [
  {
    id: '1', title: 'Café ☕', description: 'Invítame un café y apoya mi trabajo diario.',
    amount: 5, currency: 'USD', is_featured: false,
    button_label: 'Invitar café',
  },
  {
    id: '2', title: 'Apoyo Mensual 🌟', description: 'Accede a contenido exclusivo cada mes.',
    amount: 15, currency: 'USD', is_featured: true,
    button_label: 'Suscribirme',
  },
  {
    id: '3', title: 'Curso Completo 🎓', description: 'Mi curso con más de 40 horas de contenido.',
    amount: 97, currency: 'USD', is_featured: false,
    button_label: 'Obtener curso',
  },
]

const DEMO_SOCIAL = [
  { platform: 'YouTube', url: '#', icon: Video, color: 'text-rose-500' },
  { platform: 'Instagram', url: '#', icon: Camera, color: 'text-pink-500' },
  { platform: 'Twitter / X', url: '#', icon: MessageSquare, color: 'text-sky-500' },
  { platform: 'Web', url: '#', icon: Globe, color: 'text-emerald-500' },
]

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, minimumFractionDigits: 0,
  }).format(amount)
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Demo notice banner */}
      <div className="bg-emerald-500 text-white text-center py-2.5 px-4 text-sm font-medium">
        🎯 Esta es una página de demostración.{' '}
        <Link href="/auth/register" className="underline font-bold hover:no-underline">
          Crea tu perfil gratis →
        </Link>
      </div>

      {/* Back to home */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-20 pt-2">
        {/* Banner */}
        <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 mb-0">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Heart className="w-32 h-32 text-white" />
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/30">
              DEMO
            </span>
          </div>
        </div>

        {/* Avatar + Info */}
        <div className="relative px-4 -mt-10 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
            AC
          </div>
        </div>

        <div className="px-1 space-y-1 mb-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Alex Creator</h1>
              <p className="text-xs text-slate-400 font-mono">@alexcreator</p>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-colors"
              aria-label="Reportar perfil"
            >
              <Flag className="w-3.5 h-3.5" />
              Reportar
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Creador de contenido sobre productividad, tecnología y crecimiento personal.
            Comparto recursos gratuitos cada semana para ayudarte a alcanzar tus metas.
          </p>
        </div>

        {/* Social links */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DEMO_SOCIAL.map((s) => {
            const Icon = s.icon
            return (
              <span
                key={s.platform}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${s.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.platform}
              </span>
            )
          })}
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-500 transition">
            <Share2 className="w-3.5 h-3.5" />
            Compartir
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800 mb-6" />

        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
          Elige cómo apoyar a Alex Creator
        </h2>

        {/* Amount buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_BUTTONS.map((btn, i) => {
              const isSelected = i === 1
              return (
                <div
                  key={btn.id}
                  className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {btn.is_featured && (
                    <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-white" /> Popular
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{btn.title}</p>
                      {btn.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{btn.description}</p>
                      )}
                    </div>
                    <span className={`text-base font-extrabold font-mono flex-shrink-0 ${
                      isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {formatAmount(btn.amount, btn.currency)}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Seleccionado
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="sticky bottom-4">
            <Link
              href="/auth/register"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base transition-all shadow-lg hover:shadow-emerald-500/30"
            >
              <ExternalLink className="w-5 h-5" />
              Suscribirme · USD$15
            </Link>
          </div>

          {/* CTA to create own */}
          <div className="text-center p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              ¿Quieres un perfil igual que este?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crea el tuyo en menos de 2 minutos. Es completamente gratis.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition"
            >
              <Heart className="w-4 h-4 fill-white/30" />
              Crear mi perfil gratis
            </Link>
          </div>
        </div>
      </main>

      {/* Footer mini */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600 dark:hover:text-white transition">
          DonacionesSaaS
        </Link>
        {' · '}
        <Link href="/terms" className="hover:text-slate-600 dark:hover:text-white transition">Términos</Link>
        {' · '}
        <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-white transition">Privacidad</Link>
      </footer>
    </div>
  )
}
