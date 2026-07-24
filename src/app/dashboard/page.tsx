import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ExternalLink, Users, CreditCard, BarChart2,
  CheckCircle2, AlertTriangle, Link2, Globe, ArrowRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyUrlButton } from './copy-url-button'

export const metadata = { title: 'Dashboard | DonacionesSaaS' }

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://donacionessaas.com'

function ProfileCompleteness({ profile, socialCount, buttonCount }: {
  profile: { display_name: string; bio: string | null; avatar_url: string | null; banner_url: string | null }
  socialCount: number
  buttonCount: number
}) {
  const checks = [
    { label: 'Nombre visible', done: Boolean(profile.display_name) },
    { label: 'Biografía', done: Boolean(profile.bio) },
    { label: 'Foto de perfil', done: Boolean(profile.avatar_url) },
    { label: 'Banner', done: Boolean(profile.banner_url) },
    { label: 'Al menos 1 red social', done: socialCount > 0 },
    { label: 'Al menos 1 monto de apoyo', done: buttonCount > 0 },
  ]
  const done = checks.filter((c) => c.done).length
  const pct = Math.round((done / checks.length) * 100)

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Completitud del perfil</h2>
        <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{pct}%</span>
      </div>

      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            {c.done
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            }
            <span className={c.done ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}>{c.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: profile },
    { count: activeSocialCount },
    { count: activeButtonCount },
    { count: viewCount },
    { count: clickCount },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, username, bio, avatar_url, banner_url, plan, is_active').eq('id', user.id).single(),
    supabase.from('social_links').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).eq('is_active', true),
    supabase.from('donation_buttons').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).eq('is_active', true),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).eq('event_type', 'profile_view').gte('created_at', since),
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('profile_id', user.id).eq('event_type', 'hotmart_redirect').gte('created_at', since),
  ])

  if (!profile) redirect('/auth/login')

  const publicUrl = `${BASE_URL}/${profile.username}`
  const activeSocial = activeSocialCount ?? 0
  const activeButtons = activeButtonCount ?? 0
  const totalViews = viewCount ?? 0
  const totalClicks = clickCount ?? 0

  const stats = [
    { label: 'Montos activos', value: activeButtons, icon: CreditCard, color: 'text-emerald-500', href: '/dashboard/buttons' },
    { label: 'Redes sociales', value: activeSocial, icon: Link2, color: 'text-indigo-500', href: '/dashboard/social' },
    { label: 'Visitas (recientes)', value: totalViews, icon: Users, color: 'text-blue-500', href: '/dashboard/analytics' },
    { label: 'Clics a Hotmart', value: totalClicks, icon: BarChart2, color: 'text-amber-500', href: '/dashboard/analytics' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hola, {profile.display_name} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Bienvenido a tu panel de creador.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={profile.is_active ? 'emerald' : 'indigo'}>
            {profile.is_active ? 'Perfil activo' : 'Perfil inactivo'}
          </Badge>
          <Badge variant="indigo">{profile.plan}</Badge>
        </div>
      </div>

      {/* Public URL card */}
      <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">{publicUrl}</span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <CopyUrlButton url={publicUrl} />
          <Link href={`/${profile.username}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver perfil
            </Button>
          </Link>
        </div>
      </Card>

      {/* Completeness */}
      <ProfileCompleteness
        profile={profile}
        socialCount={activeSocial}
        buttonCount={activeButtons}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                  Ver detalle <ArrowRight className="w-3 h-3" />
                </p>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/profile">
          <Card className="p-4 hover:border-emerald-500/50 transition-colors cursor-pointer group">
            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Editar perfil</p>
            <p className="text-xs text-slate-400 mt-0.5">Nombre, bio, fotos e identidad</p>
          </Card>
        </Link>
        <Link href="/dashboard/social">
          <Card className="p-4 hover:border-indigo-500/50 transition-colors cursor-pointer group">
            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Redes sociales</p>
            <p className="text-xs text-slate-400 mt-0.5">Gestiona tus enlaces externos</p>
          </Card>
        </Link>
        <Link href="/dashboard/buttons">
          <Card className="p-4 hover:border-emerald-500/50 transition-colors cursor-pointer group">
            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Montos de apoyo</p>
            <p className="text-xs text-slate-400 mt-0.5">Configura tus botones de Hotmart</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
