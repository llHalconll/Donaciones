'use client'

import { useState, useTransition, useActionState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Trash2, Edit3, Star, Eye, EyeOff,
  AlertCircle, ExternalLink, CreditCard, X, ArrowUp, ArrowDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { EmojiTitleInput } from '@/components/emoji-picker-input'
import {
  createButtonAction, deleteButtonAction, moveButtonAction,
  toggleButtonAction, updateButtonAction,
} from './actions'
import type { DonationButton } from '@/types/database.types'
import {
  moveOrderedSupportOption,
  type MoveDirection,
} from '@/lib/support-options'

interface Props {
  buttons: DonationButton[]
  limit: number
  presetAmounts: number[]
}

type FormMode = 'create' | 'edit'

export function ButtonsManager({ buttons: initialButtons, limit, presetAmounts }: Props) {
  const [buttons, setButtons] = useState(initialButtons)
  const [showForm, setShowForm] = useState(false)
  const [editingButton, setEditingButton] = useState<DonationButton | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [orderMessage, setOrderMessage] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [emoji, setEmoji] = useState('')
  const [titleValue, setTitleValue] = useState('')
  const [, startTransition] = useTransition()
  const [addState, addAction, isAdding] = useActionState(createButtonAction, null)
  const [editState, editAction, isEditing] = useActionState(updateButtonAction, null)

  const atLimit = buttons.length >= limit
  const formMode: FormMode = editingButton ? 'edit' : 'create'

  const amountValue = selectedAmount !== null ? selectedAmount.toString() : customAmount

  useEffect(() => {
    if (addState?.success) window.location.reload()
  }, [addState?.success])

  useEffect(() => {
    if (editState?.success) window.location.reload()
  }, [editState?.success])

  function openCreate() {
    setEditingButton(null)
    setSelectedAmount(null)
    setCustomAmount('')
    setEmoji('')
    setTitleValue('')
    setShowForm(true)
  }

  function openEdit(btn: DonationButton) {
    setEditingButton(btn)
    setEmoji(btn.emoji ?? '')
    setTitleValue(btn.title)
    setShowForm(true)
    const isPreset = presetAmounts.includes(Number(btn.amount))
    if (isPreset) {
      setSelectedAmount(Number(btn.amount))
      setCustomAmount('')
    } else {
      setSelectedAmount(null)
      setCustomAmount(String(Number(btn.amount)))
    }
  }

  function closeForm() {
    setShowForm(false)
    setEditingButton(null)
    setSelectedAmount(null)
    setCustomAmount('')
    setEmoji('')
    setTitleValue('')
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este botón? Esta acción no se puede deshacer.')) return
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

  async function handleMove(id: string, direction: MoveDirection) {
    if (movingId) return

    setMovingId(id)
    setOrderMessage(null)
    const result = await moveButtonAction(id, direction)

    if (result.error) {
      setOrderMessage(result.error)
    } else {
      setButtons((current) =>
        moveOrderedSupportOption(current, id, direction)
      )
      setOrderMessage('Orden actualizado.')
    }
    setMovingId(null)
  }

  const getEditFormAction = useCallback(
    (fd: FormData) => { fd.set('id', editingButton!.id); return editAction(fd) },
    [editAction, editingButton]
  )

  const sharedFields = (
    <ButtonFormFields
      presetAmounts={presetAmounts}
      selectedAmount={selectedAmount}
      customAmount={customAmount}
      onSelectAmount={(a) => { setSelectedAmount(a); setCustomAmount('') }}
      onCustomAmount={(v) => { setCustomAmount(v); setSelectedAmount(null) }}
      defaultValues={formMode === 'edit' ? editingButton : null}
      emoji={emoji}
      onEmojiChange={setEmoji}
      titleValue={titleValue}
      onTitleChange={setTitleValue}
    />
  )

  return (
    <div className="space-y-4">
      {/* Empty state */}
      {buttons.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="Define la primera forma de apoyarte"
          description="Cada opción conecta una intención concreta de tu audiencia con un checkout de Hotmart."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Crear mi primera opción
            </Button>
          }
        />
      )}

      {/* Button list */}
      {orderMessage && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-slate-600 dark:text-slate-300"
        >
          {orderMessage}
        </p>
      )}
      <div className="space-y-3">
        {buttons.map((btn, index) => (
          <Card key={btn.id} className={`p-4 transition-all ${btn.is_featured ? 'border-emerald-500/50' : ''}`}>
            <div className="flex items-start gap-3">
              <div
                className="flex shrink-0 flex-col gap-1"
                role="group"
                aria-label={`Orden de ${btn.title}`}
              >
                <button
                  type="button"
                  onClick={() => handleMove(btn.id, 'up')}
                  disabled={index === 0 || movingId !== null}
                  className="flex size-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
                  aria-label={`Mover "${btn.title}" arriba`}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(btn.id, 'down')}
                  disabled={index === buttons.length - 1 || movingId !== null}
                  className="flex size-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-slate-800"
                  aria-label={`Mover "${btn.title}" abajo`}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {btn.emoji ? `${btn.emoji} ` : ''}{btn.title}
                  </span>
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
                <button onClick={() => handleToggle(btn.id, btn.is_active)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label={btn.is_active ? 'Desactivar' : 'Activar'}>
                  {btn.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(btn)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition"
                  aria-label="Editar">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(btn.id)} disabled={deletingId === btn.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition disabled:opacity-50"
                  aria-label="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add button CTA */}
      {!showForm && !atLimit && buttons.length > 0 && (
        <Button variant="outline" size="sm" onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Crear nuevo monto
        </Button>
      )}
      {atLimit && !showForm && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          Has alcanzado el límite de {limit} botones para tu plan actual.{' '}
          <Link href="/pricing" className="underline font-semibold">Ver planes &rarr;</Link>
        </p>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {formMode === 'create' ? 'Nuevo monto de apoyo' : `Editar: ${editingButton?.emoji ? editingButton.emoji + ' ' : ''}${editingButton?.title}`}
              </CardTitle>
              <button onClick={closeForm}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {formMode === 'create' ? (
              <form action={addAction} className="space-y-4">
                <input type="hidden" name="amount" value={amountValue} />
                {addState?.error && (
                  <div role="alert" className="flex items-center gap-2 text-xs text-rose-500 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {addState.error}
                  </div>
                )}
                {sharedFields}
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isAdding} disabled={!amountValue || !titleValue.trim()}>
                    Crear botón
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancelar</Button>
                </div>
              </form>
            ) : (
              <form action={getEditFormAction} className="space-y-4">
                <input type="hidden" name="amount" value={amountValue} />
                {editState?.error && (
                  <div role="alert" className="flex items-center gap-2 text-xs text-rose-500 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {editState.error}
                  </div>
                )}
                {sharedFields}
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="sm" isLoading={isEditing} disabled={!amountValue || !titleValue.trim()}>
                    Guardar cambios
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancelar</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

interface FieldProps {
  presetAmounts: number[]
  selectedAmount: number | null
  customAmount: string
  onSelectAmount: (a: number) => void
  onCustomAmount: (v: string) => void
  defaultValues: DonationButton | null
  emoji: string
  onEmojiChange: (e: string) => void
  titleValue: string
  onTitleChange: (v: string) => void
}

function ButtonFormFields({
  presetAmounts, selectedAmount, customAmount, onSelectAmount, onCustomAmount,
  defaultValues, emoji, onEmojiChange, titleValue, onTitleChange,
}: FieldProps) {
  return (
    <>
      {/* Amount selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Monto (USD)</p>
        <div className="flex flex-wrap gap-2">
          {presetAmounts.map((amt) => (
            <button key={amt} type="button" onClick={() => onSelectAmount(amt)}
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
            onChange={(e) => onCustomAmount(e.target.value)}
            className="w-28 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* WhatsApp-style title + emoji bar */}
      <div className="space-y-1.5">
        <label htmlFor="btnTitle" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Título <span className="text-rose-500">*</span>
        </label>
        <EmojiTitleInput
          value={emoji}
          onChange={onEmojiChange}
          titleValue={titleValue}
          onTitleChange={onTitleChange}
          emojiName="emoji"
          titleName="title"
          titleId="btnTitle"
          titlePlaceholder="Ej. Invítame un café"
          titleMaxLength={80}
          titleRequired
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="btnDesc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Descripción (opcional)
        </label>
        <input id="btnDesc" name="description" type="text" maxLength={160}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Breve descripción para el visitante"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Hotmart URL */}
      <div className="space-y-1.5">
        <label htmlFor="btnUrl" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          URL de checkout Hotmart <span className="text-rose-500">*</span>
        </label>
        <input id="btnUrl" name="hotmartUrl" type="url" required
          defaultValue={defaultValues?.hotmart_checkout_url ?? ''}
          placeholder="https://pay.hotmart.com/..."
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <p className="text-xs text-slate-400">Solo se aceptan URLs de dominios oficiales de Hotmart con HTTPS.</p>
      </div>

      {/* Button label */}
      <div className="space-y-1.5">
        <label htmlFor="btnLabel" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Texto del botón (opcional)
        </label>
        <input id="btnLabel" name="buttonLabel" type="text" maxLength={40}
          defaultValue={defaultValues?.button_label ?? ''}
          placeholder="Ej. Apoyar ahora"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Featured toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="isFeatured" value="true"
          defaultChecked={defaultValues?.is_featured ?? false}
          className="w-4 h-4 rounded border-slate-300 accent-emerald-500" />
        <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" /> Marcar como monto destacado
        </span>
      </label>
    </>
  )
}
