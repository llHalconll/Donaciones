import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Users, CreditCard, ArrowLeft, ShieldX } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Verificar que haya sesión activa
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 2. Consultar perfil real en Supabase — no confiar en user_metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, display_name')
    .eq('id', user.id)
    .single()

  // 3. Si no es administrador, mostrar página 403 (sin redirigir al dashboard
  //    para no revelar que el panel existe en esa URL)
  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <ShieldX className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Acceso Denegado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No tienes permisos para acceder al panel de administración.
          </p>
        </div>

        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver a mi Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  // 4. Solo llega aquí si is_admin === true en la base de datos
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Panel de Administración
                </h1>
                <Badge variant="indigo">Administrador</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesión como: {profile.display_name}
              </p>
            </div>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* Métricas globales — datos reales se implementarán en Fase 8 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Creadores
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">—</p>
            <p className="text-xs text-slate-400 mt-1">Disponible en Fase 8</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Botones Configurados
              </span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">—</p>
            <p className="text-xs text-slate-400 mt-1">Disponible en Fase 8</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Perfiles Activos
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">—</p>
            <p className="text-xs text-slate-400 mt-1">Disponible en Fase 8</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
