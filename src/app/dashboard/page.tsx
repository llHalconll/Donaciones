import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, UserCircle, CreditCard, Eye, MousePointerClick } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Creador'
  const username = profile?.username || user?.user_metadata?.username || 'usuario'

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent border border-emerald-500/20">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <Badge variant="emerald">Perfil Activo</Badge>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">@{username}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">¡Hola, {displayName}! 👋</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestiona la apariencia de tu perfil y la configuración de tus botones de donación de Hotmart.
          </p>
        </div>

        <Link href={`/${username}`} target="_blank">
          <Button variant="primary" size="sm" className="whitespace-nowrap shadow-sm">
            Ver Perfil Público
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Shareable Link Card */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tu Enlace Público de Donaciones
            </span>
            <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">
              donaciones.com/{username}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <Copy className="w-4 h-4" />
              Copiar Enlace
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Botones de Hotmart</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
          <p className="text-xs text-slate-400">Configurados y activos</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Visitas Estimadas</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
          <p className="text-xs text-slate-400">Últimos 30 días</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Clics en Donaciones</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">0</p>
          <p className="text-xs text-slate-400">Redirecciones a Hotmart</p>
        </Card>
      </div>

      {/* Action Shortcut Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="w-5 h-5 text-indigo-500" />
              <span>Personalizar Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Actualiza tu avatar, imagen de portada/banner, biografía y enlaces a tus redes sociales.
            </p>
            <Link href="/dashboard/profile" className="block">
              <Button variant="outline" size="sm" className="w-full">
                Editar Información de Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <span>Gestionar Botones de Donación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Crea nuevos niveles de donación con montos fijos y asocia cada uno a tu checkout oficial de Hotmart.
            </p>
            <Link href="/dashboard/buttons" className="block">
              <Button variant="outline" size="sm" className="w-full">
                Configurar Botones y URLs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
