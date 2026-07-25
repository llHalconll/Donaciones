import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, Eye, MousePointerClick, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

export const metadata = { title: 'Estadísticas | Dashboard' }

function StatCard({ label, value, icon: Icon, note }: {
  label: string; value: number; icon: typeof BarChart2; note?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <Icon className="w-4 h-4 text-emerald-500" />
      </div>
      <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value.toLocaleString('es-CO')}</p>
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </Card>
  )
}

export default async function AnalyticsPage() {
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/auth/login')

  // Last 30 days — use aggregated server-side counts to avoid fetching all rows
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: events }, { count: totalViews }, { count: totalSelections }, { count: totalRedirects }, { data: buttons }] = await Promise.all([
    // Only fetch recent 7-day events for the trend table (limited row count)
    supabase
      .from('analytics_events')
      .select('event_type, donation_button_id, created_at')
      .eq('profile_id', user.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(500),
    // Aggregated counts for 30-day stats (head:true — no row data transferred)
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
      .eq('event_type', 'amount_selected')
      .gte('created_at', since),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('event_type', 'hotmart_redirect')
      .gte('created_at', since),
    supabase
      .from('donation_buttons')
      .select('id, title, amount, currency')
      .eq('profile_id', user.id)
      .eq('is_active', true),
  ])

  const views = totalViews ?? 0
  const selections = totalSelections ?? 0
  const redirects = totalRedirects ?? 0

  // Top buttons by redirects (from 7-day data)
  const buttonClickMap = new Map<string, number>()
  events?.filter((e) => e.event_type === 'hotmart_redirect' && e.donation_button_id).forEach((e) => {
    const id = e.donation_button_id!
    buttonClickMap.set(id, (buttonClickMap.get(id) ?? 0) + 1)
  })

  const topButtons = (buttons ?? [])
    .map((btn) => ({ ...btn, clicks: buttonClickMap.get(btn.id) ?? 0 }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)

  // Events by day (last 7 days)
  const dayMap = new Map<string, { views: number; redirects: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    dayMap.set(key, { views: 0, redirects: 0 })
  }
  events?.forEach((e) => {
    const day = e.created_at.slice(0, 10)
    if (dayMap.has(day)) {
      const entry = dayMap.get(day)!
      if (e.event_type === 'profile_view') entry.views++
      if (e.event_type === 'hotmart_redirect') entry.redirects++
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estadísticas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Últimos 30 días. Los datos reflejan visitas y clics, no pagos confirmados.</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Visitas al perfil" value={views} icon={Eye} note="30 días" />
        <StatCard label="Selecciones de monto" value={selections} icon={MousePointerClick} note="30 días" />
        <StatCard label="Clics hacia Hotmart" value={redirects} icon={TrendingUp} note="30 días" />
      </div>

      {/* Daily trend (last 7 days) */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tendencia — últimos 7 días</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left pb-2 pr-4">Fecha</th>
                <th className="text-right pb-2 pr-4">Visitas</th>
                <th className="text-right pb-2">Clics Hotmart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...dayMap.entries()].map(([day, data]) => (
                <tr key={day}>
                  <td className="py-2 pr-4 font-mono text-slate-600 dark:text-slate-400">{day}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-700 dark:text-slate-300">{data.views}</td>
                  <td className="py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{data.redirects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top buttons */}
      {topButtons.length > 0 && (
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Montos con más clics (7 días)</h2>
          <div className="space-y-2">
            {topButtons.map((btn, i) => (
              <div key={btn.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{btn.title}</p>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    {btn.currency} {Number(btn.amount).toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">{btn.clicks}</span>
                <span className="text-xs text-slate-400">clics</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-amber-700 dark:text-amber-400 space-y-1">
        <p><strong>Nota importante:</strong> Las estadísticas muestran visitas y clics hacia Hotmart, no pagos confirmados.</p>
        <p>Un clic hacia Hotmart no equivale a una transacción completada. La confirmación de pago ocurre externamente en Hotmart.</p>
      </div>
    </div>
  )
}
