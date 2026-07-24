import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyRound } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Cuenta</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Administra las credenciales de acceso a tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-500" />
            <span>Cambiar Contraseña</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Contraseña Actual" type="password" placeholder="••••••••" />
          <Input label="Nueva Contraseña" type="password" placeholder="••••••••" />
          <Button variant="primary" size="sm">
            Actualizar Contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
