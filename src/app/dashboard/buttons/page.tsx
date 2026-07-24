import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CreditCard, ExternalLink, Trash2, Edit3 } from 'lucide-react'

export default function DonationButtonsPage() {
  const mockButtons = [
    {
      id: '1',
      title: 'Invítame un Café ☕',
      amount: '$5.00',
      hotmartUrl: 'https://pay.hotmart.com/demo_cafe_5usd',
    },
    {
      id: '2',
      title: 'Aporte Semilla 🌱',
      amount: '$15.00',
      hotmartUrl: 'https://pay.hotmart.com/demo_semilla_15usd',
    },
    {
      id: '3',
      title: 'Patrocinador VIP 🚀',
      amount: '$50.00',
      hotmartUrl: 'https://pay.hotmart.com/demo_vip_50usd',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Botones de Donación</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configura los montos de donación fija y asócialos a tus enlaces de pago de Hotmart.
          </p>
        </div>

        <Button variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          Crear Nuevo Botón
        </Button>
      </div>

      <div className="space-y-4">
        {mockButtons.map((btn) => (
          <Card key={btn.id} className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{btn.title}</h3>
                    <Badge variant="emerald">{btn.amount}</Badge>
                  </div>
                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-xs sm:max-w-md">
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                    {btn.hotmartUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm">
                  <Edit3 className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
