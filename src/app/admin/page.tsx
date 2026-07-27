import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonStyles } from '@/components/ui/button'
import {
  ShieldCheck, Users, CreditCard, ArrowLeft, ShieldX,
  Flag, AlertTriangle, Link2,
} from 'lucide-react'

export const metadata = { title: 'Panel de Administración | DonacionesSaaS' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <ShieldX className="w-7 h-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Acceso Denegado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No tienes permisos para acceder al panel de administración.
          </p>
        </div>
        <Link href="/dashboard" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="w-4 h-4" /> Volver a mi panel
        </Link>
      </div>
    )
  }

  // Real stats
  const [
    { count: totalProfiles },
    { count: activeProfiles },
    { count: totalButtons },
    { count: pendingReports },
    { data: recentProfiles },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('donation_buttons').select('id', { count: 'exact', head: true }),
    supabase.from('profile_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('id, username, display_name, account_type, plan, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const stats = [
    { label: 'Creadores totales', value: totalProfiles ?? 0, icon: Users, color: 'text-indigo-500' },
    { label: 'Perfiles activos', value: activeProfiles ?? 0, icon: ShieldCheck, color: 'text-emerald-500' },
    { label: 'Botones configurados', value: totalButtons ?? 0, icon: CreditCard, color: 'text-emerald-500' },
    { label: 'Reportes pendientes', value: pendingReports ?? 0, icon: Flag, color: pendingReports ? 'text-rose-500' : 'text-slate-400' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Panel de Administración</h1>
                <Badge variant="indigo">Admin</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sesión como: {profile.display_name}</p>
            </div>
          </div>
          <Link href="/dashboard" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
            <ArrowLeft className="w-4 h-4" /> Panel del creador
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {stat.value.toLocaleString('es-CO')}
                </p>
              </Card>
            )
          })}
        </div>

        {/* Pending reports alert */}
        {(pendingReports ?? 0) > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Hay <strong>{pendingReports}</strong> reporte(s) pendiente(s) de revisión.{' '}
              <Link href="/admin/reports" className="underline font-semibold">Revisar reportes →</Link>
            </p>
          </div>
        )}

        {/* Recent profiles */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Últimos creadores registrados
            </h2>
            <span className="text-xs text-slate-400">Mostrando últimos 20</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left pb-2 pr-4">Usuario</th>
                  <th className="text-left pb-2 pr-4">Tipo</th>
                  <th className="text-left pb-2 pr-4">Plan</th>
                  <th className="text-left pb-2 pr-4">Estado</th>
                  <th className="text-left pb-2">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(recentProfiles ?? []).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{p.display_name}</p>
                        <a href={`/${p.username}`} target="_blank" rel="noreferrer"
                          className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                          @{p.username} <Link2 className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="indigo" className="text-[10px]">{p.account_type}</Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-slate-600 dark:text-slate-400">{p.plan}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={p.is_active ? 'emerald' : 'indigo'} className="text-[10px]">
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
