import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Flag, ExternalLink, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { AdminReportActions } from './report-actions'

export const metadata = { title: 'Reportes | Admin' }

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  variant: 'indigo'  as const, icon: Clock },
  reviewed:  { label: 'Revisado',   variant: 'indigo'  as const, icon: Eye },
  resolved:  { label: 'Resuelto',   variant: 'emerald' as const, icon: CheckCircle2 },
  dismissed: { label: 'Descartado', variant: 'indigo'  as const, icon: XCircle },
}

const REASON_LABELS: Record<string, string> = {
  fraud: 'Fraude o estafa',
  impersonation: 'Suplantación de identidad',
  prohibited_content: 'Contenido prohibido',
  suspicious_link: 'Enlace sospechoso',
  spam: 'Spam',
  other: 'Otro',
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  const { data: reports } = await supabase
    .from('profile_reports')
    .select(`
      id, reason, description, reporter_email, status,
      created_at, reviewed_at,
      profiles:profile_id ( id, username, display_name )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const pending = reports?.filter((r) => r.status === 'pending').length ?? 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-500" /> Reportes de Perfiles
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-8">
              {pending > 0
                ? <span className="text-rose-500 font-semibold">{pending} pendiente(s) de revisión</span>
                : 'Sin reportes pendientes'}
            </p>
          </div>
        </div>

        {(!reports || reports.length === 0) ? (
          <Card className="p-12 text-center">
            <Flag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay reportes registrados.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              const StatusIcon = statusCfg.icon
              const reportedProfile = report.profiles as { id: string; username: string; display_name: string } | null

              return (
                <Card key={report.id} className={`p-4 ${report.status === 'pending' ? 'border-rose-500/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusCfg.variant} className="flex items-center gap-1 text-[10px]">
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </Badge>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(report.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Reported profile */}
                      {reportedProfile && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Perfil reportado:</span>
                          <a
                            href={`/${reportedProfile.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            @{reportedProfile.username}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-xs text-slate-400">({reportedProfile.display_name})</span>
                        </div>
                      )}

                      {/* Description */}
                      {report.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-800">
                          {report.description}
                        </p>
                      )}

                      {/* Reporter email (admin-only, never public) */}
                      {report.reporter_email && (
                        <p className="text-xs text-slate-400">
                          Reportado por: <span className="font-mono">{report.reporter_email}</span>
                        </p>
                      )}

                      {/* Reviewed info */}
                      {report.reviewed_at && (
                        <p className="text-xs text-slate-400">
                          Revisado: {new Date(report.reviewed_at).toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>

                    {/* Actions (client component) */}
                    {report.status === 'pending' && (
                      <AdminReportActions reportId={report.id} />
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
