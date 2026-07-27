import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Zap, Building2, Heart, ArrowRight, Mail } from 'lucide-react'
import { PublicHeader } from '@/components/shared/header'
import { PublicFooter } from '@/components/shared/footer'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getSupportEmail } from '@/lib/public-config'

export const metadata: Metadata = {
  title: 'Planes y Precios | DonacionesSaaS',
  description: 'Elige el plan que mejor se adapte a ti como creador, organización o empresa.',
}

const PLANS = [
  {
    key: 'free',
    name: 'Gratuito',
    price: 'Gratis',
    badge: null,
    desc: 'Para creadores que están comenzando.',
    icon: Heart,
    color: 'text-slate-500',
    borderColor: 'border-slate-200 dark:border-slate-800',
    features: [
      'Perfil público personalizable',
      'Hasta 5 botones de donación',
      'Hasta 5 redes sociales',
      'Avatar y banner de perfil',
      'Página pública única (URL propia)',
      'Estadísticas básicas de visitas',
      'Integración directa con Hotmart',
      'Modo claro y oscuro',
    ],
    cta: 'Crear cuenta gratis',
    ctaHref: '/auth/register',
    ctaVariant: 'outline',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 'USD$9',
    priceSuffix: '/mes',
    badge: 'Más popular',
    desc: 'Para creadores con audiencia creciente.',
    icon: Zap,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-500',
    features: [
      'Todo lo del plan Gratuito',
      'Hasta 20 botones de donación',
      'Hasta 15 redes sociales',
      'Estadísticas avanzadas (30 días)',
      'Soporte prioritario por email',
      'Próximamente: dominio personalizado',
    ],
    cta: 'Solicitar plan Pro',
    ctaSubject: 'Solicitud Plan Pro',
    ctaVariant: 'primary',
  },
  {
    key: 'organization',
    name: 'Organización',
    price: 'USD$29',
    priceSuffix: '/mes',
    badge: null,
    desc: 'Para empresas, iglesias, fundaciones y proyectos.',
    icon: Building2,
    color: 'text-indigo-600',
    borderColor: 'border-indigo-500',
    features: [
      'Todo lo del plan Pro',
      'Hasta 50 botones de donación',
      'Hasta 30 redes sociales',
      'Estadísticas completas (1 año)',
      'Soporte dedicado',
      'Múltiples administradores (próximo)',
      'Informes exportables CSV (próximo)',
    ],
    cta: 'Contactar ventas',
    ctaSubject: 'Solicitud Plan Organización',
    ctaVariant: 'outline',
  },
] as const

export default function PricingPage() {
  const supportEmail = getSupportEmail()

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="emerald">Planes y precios</Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Elige el plan que se ajusta a tu perfil
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu proyecto.
              Todos los planes incluyen tu perfil público permanente con URL propia.
            </p>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isPopular = plan.badge !== null
              const ctaHref = 'ctaHref' in plan
                ? plan.ctaHref
                : supportEmail
                  ? `mailto:${supportEmail}?subject=${encodeURIComponent(plan.ctaSubject)}`
                  : null
              return (
                <Card
                  key={plan.key}
                  className={`p-6 space-y-6 relative ${
                    isPopular ? `${plan.borderColor} border-2` : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge variant="emerald" className="px-3 py-1 text-xs">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.key === 'pro' ? 'bg-emerald-500/10' :
                      plan.key === 'organization' ? 'bg-indigo-500/10' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{plan.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                    {'priceSuffix' in plan && plan.priceSuffix && (
                      <span className="text-sm text-slate-400">{plan.priceSuffix}</span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {ctaHref ? (
                    <Link
                      href={ctaHref}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                        plan.ctaVariant === 'primary'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Contacto no configurado
                    </span>
                  )}
                </Card>
              )
            })}
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Preguntas frecuentes</h2>
            <div className="space-y-4">
              {[
                {
                  q: '¿DonacionesSaaS cobra comisión por cada apoyo?',
                  a: 'DonacionesSaaS no añade una comisión por cada apoyo. El checkout se completa en Hotmart, que puede aplicar sus propias tarifas según tu cuenta y producto. La suscripción de DonacionesSaaS se cobra por separado cuando eliges un plan de pago.',
                },
                {
                  q: '¿Puedo empezar con el plan gratuito y luego subir?',
                  a: 'Sí. Puedes crear tu cuenta con el plan gratuito hoy y contactarnos cuando quieras escalar a Pro u Organización.',
                },
                {
                  q: '¿Cómo funciona el pago de los planes Pro y Organización?',
                  a: 'Actualmente los cambios de plan se coordinan manualmente. Envíanos un correo para revisar la opción y completar la activación.',
                },
                {
                  q: '¿Puedo cancelar en cualquier momento?',
                  a: 'Sí, sin penalidades. Tu perfil pasa al plan gratuito con sus límites correspondientes.',
                },
              ].map(({ q, a }) => (
                <Card key={q} className="p-5 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{q}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center p-8 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <Mail className="w-8 h-8 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">¿Tienes dudas?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Escríbenos para resolver dudas sobre el plan adecuado.
            </p>
            {supportEmail ? (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition"
              >
                <Mail className="w-4 h-4" />
                Contactar soporte
              </a>
            ) : (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                El canal de soporte todavía no está configurado.
              </p>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
