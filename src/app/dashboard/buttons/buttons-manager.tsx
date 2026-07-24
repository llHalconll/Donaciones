'use client'

import { useState, useTransition, useActionState } from 'react'
import {
  Plus, Trash2, Edit3, Star, Eye, EyeOff,
  CheckCircle2, AlertCircle, ExternalLink, CreditCard, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createButtonAction, deleteButtonAction, toggleButtonAction } from './actions'
import type { DonationButton } from '@/types/database.types'

interface Props {
  buttons: DonationButton[]
  limit: number
  presetAmounts: number[]
}

type FormMode = 'create' | 'edit'

export function ButtonsManager({ buttons: initialButtons, limit, presetAmounts }: Props) {
  const [buttons, setButtons] = useState(initialButtons)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [, startTransition] = useTransition()
  const [addState, addAction, isAdding] = useActionState(createButtonAction, null)

  const atLimit = buttons.length >= limit
  const formMode: FormMode = editingId ? 'edit' : 'create'

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteButtonAction(id)
    if (!result.error) setButtons((prev) => prev.filter((b) => b.id !== id))
    setDeletingId(null)
  }

  async function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleButtonAction(id, !current)
      if (!result.error) setButtons((prev) => prev.map((b) => b.id === id ? { ...b, is_active: !current } : b))
    })
  }

  const amountValue = selectedAmount !== null
    ? selectedAmount.toString()
    : customAmount

  return (
    <div className="space-y-4">
      {/* Button list */}
      {buttons.length === 0 && (
        <Card className="p-8 text-center space-y-2">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Aún no tienes montos configurados.</p>
          <p className="text-xs text-slate-400">Crea tu primer botón para empezar a recibir apoyos.</p>
        </Card>
      )}

      <div className="space-y-3">
        {buttons.map((btn) => (
          <Card key={btn.id} className={`p-4 transition-all ${btn.is_featured ? 'border-emerald-500/50 bg-emerald-500/2' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{btn.title}</span>
                  <Badge variant="emerald" className="font-mono text-xs">
                    {btn.currency} {Number(btn.amount).toFixed(2)}
                  </Badge>
                  {btn.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Star className="w-2.5 h-2.5 fill-current" /> Destacado
                    </span>
                  )}
                  <Badge variant={btn.is_active ? 'emerald' : 'indigo'} className="text-[10px] px-1.5">
                    {btn.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {btn.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{btn.description}</p>
                )}
                <a href={btn.hotmart_checkout_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-emerald-500 transition truncate mt-1">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{btn.hotmart_checkout_url}</span>
                </a>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggle(btn.id, btn.is_active)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label={btn.is_active ? 'Desactivar' : 'Activar'}
                >
                  {btn.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setEditingId(btn.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition"
                  aria-label="Editar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(btn.id)}
                  disabled={deletingId === btn.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add button */}
      {!showForm && !editingId && !atLimit && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Crear nuevo monto
        </Button>
      )}

      {atLimit && !showForm && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          Has alcanzado el límite de {limit} botones para tu plan actual.
        </p>
      )}

      {/* Create/Edit Form */}
      {(showForm || editingId) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{formMode === 'create' ? 'Nuevo monto de apoyo' : 'Editar monto'}</CardTitle>
              <button onClick={() => { setShowForm(false); setEditingId(null); setSelectedAmount(null); setCustomAmount('') }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form action={async (fd) => {
              await addAction(fd)
              if (!addState?.error) { setShowForm(false); setSelectedAmount(null); setCustomAmount('') }
            }} className="space-y-4">
              <input type="hidden" name="amount" value={amountValue} />

              {addState?.error && (
                <div role="alert" className="flex items-center gap-2 text-xs text-rose-500 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {addState.error}
                </div>
              )}
              {addState?.success && (
                <div role="status" className="flex items-center gap-2 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {addState.success}
                </div>
              )}

              {/* Preset amounts */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Monto (USD)</p>
                <div className="flex flex-wrap gap-2">
                  {presetAmounts.map((amt) => (
                    <button key={amt} type="button"
                      onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border transition ${
                        selectedAmount === amt
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
                      }`}>
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">O ingresa un monto:</span>
                  <input type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                    className="w-28 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="btnTitle" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Título <span className="text-rose-500">*</span></label>
                <input id="btnTitle" name="title" type="text" required maxLength={80} placeholder="Ej. Invítame un café ☕"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="btnDesc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Descripción (opcional)</label>
                <input id="btnDesc" name="description" type="text" maxLength={160} placeholder="Breve descripción para el visitante"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="btnUrl" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  URL de checkout Hotmart <span className="text-rose-500">*</span>
                </label>
                <input id="btnUrl" name="hotmartUrl" type="url" required
                  placeholder="https://pay.hotmart.com/..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-slate-400">Solo se aceptan URLs de dominios oficiales de Hotmart con HTTPS.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="btnLabel" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Texto del botón (opcional)</label>
                <input id="btnLabel" name="buttonLabel" type="text" maxLength={40} placeholder="Ej. Apoyar ahora"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isFeatured" value="true"
                  className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" /> Marcar como monto destacado
                </span>
              </label>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isAdding} disabled={!amountValue}>
                  {formMode === 'create' ? 'Crear botón' : 'Guardar cambios'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null) }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
