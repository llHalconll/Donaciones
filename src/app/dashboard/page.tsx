import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe,
  Link2,
  Settings2,
  UserCircle,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonStyles } from '@/components/ui/button'
import { CopyUrlButton } from './copy-url-button'
import { getDashboardProfile } from '@/lib/dashboard-profile'
import { isoDaysAgo, PLAN_LABELS } from '@/lib/presentation'
import { resolveSiteUrl } from '@/lib/site-url'
import type { PlanType } from '@/types/database.types'

export const metadata = { title: 'Panel del creador | DonacionesSaaS' }

type ProfileSummary = {
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
}

function ProfileCompleteness({
  profile,
  socialCount,
  buttonCount,
}: {
  profile: ProfileSummary
  socialCount: number
  buttonCount: number
}) {
  const checks = [
    { label: 'Añade una biografía', done: Boolean(profile.bio), href: '/dashboard/profile' },
    { label: 'Sube una foto de perfil', done: Boolean(profile.avatar_url), href: '/dashboard/profile' },
    { label: 'Añade una portada', done: Boolean(profile.banner_url), href: '/dashboard/profile' },
    { label: 'Conecta una red social', done: socialCount > 0, href: '/dashboard/social' },
    { label: 'Crea un monto de apoyo', done: buttonCount > 0, href: '/dashboard/buttons' },
  ]
  const done = checks.filter((check) => check.done).length
  const percentage = Math.round((done / checks.length) * 100)
  const pending = checks.filter((check) => !check.done)
  const nextAction = pending[0]

  if (percentage === 100) {
    return (
      <section aria-labelledby="profile-status-title">
        <Card className="flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="profile-status-title" className="font-bold text-slate-900 dark:text-white">Perfil completo</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Tu página está lista para compartir.</p>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section aria-labelledby="profile-status-title">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <h2 id="profile-status-title" className="text-base font-bold text-slate-900 dark:text-white">
                Completa tu perfil
              </h2>
              <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{percentage}%</span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Termina estos pasos para presentar una página clara y confiable.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-label="Progreso de configuración del perfil"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
          <div className="lg:min-w-72">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Siguiente paso
            </p>
            <Link
              href={nextAction.href}
              className={buttonStyles({ variant: 'outline', className: 'w-full justify-between' })}
            >
              {nextAction.label}
              <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
            {pending.length > 1 && (
              <p className="mt-2 text-xs text-slate-400">
                Después quedarán {pending.length - 1} pasos para publicar con confianza.
              </p>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}

export default async function DashboardPage() {
  const { user, supabase, profile } = await getDashboardProfile()
  if (!user || !profile) redirect('/auth/login')

  const since = isoDaysAgo(30)
  const [
    { count: activeSocialCount },
    { count: activeButtonCount },
    { count: totalViews },
    { count: totalClicks },
  ] = await Promise.all([
    supabase
      .from('social_links')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('is_active', true),
    supabase
      .from('donation_buttons')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('is_active', true),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('event_type', 'profile_view')
      .gte('created_at', since),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('event_type', 'hotmart_redirect')
      .gte('created_at', since),
  ])

  const publicUrl = `${resolveSiteUrl()}/${profile.username}`
  const activeSocial = activeSocialCount ?? 0
  const activeButtons = activeButtonCount ?? 0
  const planLabel = PLAN_LABELS[profile.plan as PlanType] ?? 'Plan'

  const stats = [
    { label: 'Montos activos', value: activeButtons, icon: CreditCard, href: '/dashboard/buttons' },
    { label: 'Redes sociales', value: activeSocial, icon: Link2, href: '/dashboard/social' },
    { label: 'Visitas en 30 días', value: totalViews ?? 0, icon: Users, href: '/dashboard/analytics' },
    { label: 'Clics a Hotmart', value: totalClicks ?? 0, icon: BarChart2, href: '/dashboard/analytics' },
  ]

  const quickActions = [
    { title: 'Editar perfil', description: 'Actualiza tu identidad y presentación.', href: '/dashboard/profile', icon: UserCircle },
    { title: 'Redes sociales', description: 'Gestiona tus enlaces externos.', href: '/dashboard/social', icon: Link2 },
    { title: 'Montos de apoyo', description: 'Configura tus enlaces de Hotmart.', href: '/dashboard/buttons', icon: Settings2 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Hola, {profile.display_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Gestiona tu perfil público y revisa su rendimiento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={profile.is_active ? 'success' : 'warning'}>
            {profile.is_active ? 'Perfil activo' : 'Perfil inactivo'}
          </Badge>
          <Badge variant="slate">{planLabel}</Badge>
        </div>
      </div>

      <section aria-labelledby="public-url-title">
        <div className="border-y border-slate-200 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p id="public-url-title" className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Perfil público
              </p>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <Globe className="size-5 shrink-0 text-emerald-500" aria-hidden="true" />
                <span className="truncate font-mono text-sm font-medium text-slate-800 dark:text-slate-200 sm:text-base">
                  {publicUrl}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyUrlButton url={publicUrl} />
              <Link
                href={`/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: 'outline', size: 'sm' })}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProfileCompleteness profile={profile} socialCount={activeSocial} buttonCount={activeButtons} />

      <section aria-labelledby="metrics-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="metrics-title" className="text-xl font-bold text-slate-900 dark:text-white">Resumen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visitas y clics corresponden a los últimos 30 días.</p>
          </div>
          <Link href="/dashboard/analytics" className="hidden min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 sm:flex">
            Ver estadísticas <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 border-y border-slate-200 dark:border-slate-800 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href} className="group flex min-h-36 flex-col border-b border-r border-slate-200 p-4 transition-colors hover:bg-white focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-800 dark:hover:bg-slate-900 sm:p-5 xl:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                      {stat.value.toLocaleString('es-CO')}
                    </p>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.label}</p>
                  <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-slate-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Ver detalle <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Accesos rápidos</h2>
        <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="group flex min-h-24 items-center gap-4 px-1 py-4 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-900 sm:px-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:text-emerald-400">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-white">
                      {action.title}
                      <ArrowRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">{action.description}</span>
                  </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
