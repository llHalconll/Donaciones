'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  ExternalLink,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatSupportAmount } from '@/lib/presentation'
import type {
  SupportAmount,
  SupportGoal,
} from '@/types/database.types'
import type { MoveDirection } from '@/lib/support-goals'
import {
  createSupportAmountAction,
  deleteSupportAmountAction,
  moveSupportAmountAction,
  updateSupportAmountAction,
  type ActionResult,
} from '../actions'

interface Props {
  goal: SupportGoal
  amounts: SupportAmount[]
  limit: number
}

export function GoalLevelsManager({ goal, amounts, limit }: Props) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<SupportAmount | null>(null)
  const [message, setMessage] = useState<ActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  const atLimit = amounts.length >= limit

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      setMessage(result)
      if (!result.error) {
        onSuccess?.()
        router.refresh()
      }
    })
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('goalId', goal.id)
    run(
      () => createSupportAmountAction(formData),
      () => {
        form.reset()
        setShowCreate(false)
      }
    )
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.set('id', editing!.id)
    run(() => updateSupportAmountAction(formData), () => setEditing(null))
  }

  function handleDelete(amount: SupportAmount) {
    if (
      !window.confirm(
        `¿Eliminar el nivel ${formatSupportAmount(
          Number(amount.amount),
          amount.currency
        )}?`
      )
    ) {
      return
    }
    run(() => deleteSupportAmountAction(amount.id))
  }

  function handleMove(id: string, direction: MoveDirection) {
    run(() => moveSupportAmountAction(id, direction))
  }

  return (
    <div className="space-y-5">
      {message && (
        <div
          role={message.error ? 'alert' : 'status'}
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.error
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {message.error ?? message.success}
        </div>
      )}

      <div className="flex flex-col gap-3 border-y border-slate-200 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">
            {amounts.length} {amounts.length === 1 ? 'nivel' : 'niveles'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Máximo técnico: {limit} niveles por objetivo.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowCreate(true)}
          disabled={atLimit || showCreate}
        >
          <Plus className="size-4" aria-hidden="true" />
          {atLimit ? 'Límite alcanzado' : 'Agregar nivel'}
        </Button>
      </div>

      {showCreate && (
        <AmountForm
          title="Nuevo nivel"
          submitLabel="Agregar nivel"
          pending={pending}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <AmountForm
          title={`Editar ${formatSupportAmount(
            Number(editing.amount),
            editing.currency
          )}`}
          submitLabel="Guardar nivel"
          pending={pending}
          amount={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {amounts.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Este objetivo aún no tiene niveles"
          description="Añade el primer monto y su URL de checkout real en Hotmart."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Agregar primer nivel
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {amounts.map((amount, index) => (
            <Card key={amount.id} className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex shrink-0 gap-1"
                  role="group"
                  aria-label={`Orden de ${formatSupportAmount(
                    Number(amount.amount),
                    amount.currency
                  )}`}
                >
                  <button
                    type="button"
                    onClick={() => handleMove(amount.id, 'up')}
                    disabled={pending || index === 0}
                    className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:hover:bg-slate-800"
                    aria-label="Mover nivel arriba"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(amount.id, 'down')}
                    disabled={pending || index === amounts.length - 1}
                    className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:hover:bg-slate-800"
                    aria-label="Mover nivel abajo"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {formatSupportAmount(
                        Number(amount.amount),
                        amount.currency
                      )}
                    </p>
                    {amount.is_featured && (
                      <Badge variant="warning">
                        <Star
                          className="size-3 fill-current"
                          aria-hidden="true"
                        />
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  <a
                    href={amount.hotmart_checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex min-h-11 max-w-xl items-center gap-1.5 break-all text-xs text-slate-500 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400"
                  >
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                    {amount.hotmart_checkout_url}
                  </a>
                </div>

                <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setEditing(amount)}
                    disabled={pending}
                    className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40"
                    aria-label={`Editar nivel ${formatSupportAmount(
                      Number(amount.amount),
                      amount.currency
                    )}`}
                  >
                    <Edit3 className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(amount)}
                    disabled={pending}
                    className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40"
                    aria-label={`Eliminar nivel ${formatSupportAmount(
                      Number(amount.amount),
                      amount.currency
                    )}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AmountForm({
  title,
  submitLabel,
  pending,
  amount,
  onSubmit,
  onCancel,
}: {
  title: string
  submitLabel: string
  pending: boolean
  amount?: SupportAmount
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
          aria-label="Cerrar formulario"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label
              htmlFor={`amount-${amount?.id ?? 'new'}`}
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Monto <span className="text-rose-500">*</span>
            </label>
            <input
              id={`amount-${amount?.id ?? 'new'}`}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={amount ? Number(amount.amount) : ''}
              placeholder="25.00"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label
              htmlFor={`currency-${amount?.id ?? 'new'}`}
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Moneda
            </label>
            <input
              id={`currency-${amount?.id ?? 'new'}`}
              name="currency"
              type="text"
              required
              minLength={3}
              maxLength={3}
              defaultValue={amount?.currency ?? 'USD'}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`hotmart-${amount?.id ?? 'new'}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Checkout Hotmart <span className="text-rose-500">*</span>
          </label>
          <input
            id={`hotmart-${amount?.id ?? 'new'}`}
            name="hotmartUrl"
            type="url"
            required
            defaultValue={amount?.hotmart_checkout_url ?? ''}
            placeholder="https://pay.hotmart.com/XXXXXXXXX"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Pega el enlace de tu producto en Hotmart. No necesitas incluir el código
            de oferta en la URL, el campo de abajo lo agrega automáticamente.
          </p>
        </div>

        <div>
          <label
            htmlFor={`hotmart-offer-${amount?.id ?? 'new'}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Código de oferta para overlay (opcional)
          </label>
          <input
            id={`hotmart-offer-${amount?.id ?? 'new'}`}
            name="hotmartOfferCode"
            type="text"
            maxLength={128}
            autoComplete="off"
            defaultValue={amount?.hotmart_offer_code ?? ''}
            placeholder="Ej. kjl7fk5t"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Cópialo desde Hotmart → Fijación de precios y ofertas.
            El sistema construye automáticamente el enlace{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono dark:bg-slate-800">
              ?off=código
            </code>{' '}
            con la URL de arriba. Déjalo vacío para usar el enlace sin código de oferta.
          </p>
        </div>

        <div>
          <label
            htmlFor={`label-${amount?.id ?? 'new'}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Etiqueta interna opcional
          </label>
          <input
            id={`label-${amount?.id ?? 'new'}`}
            name="buttonLabel"
            type="text"
            maxLength={40}
            defaultValue={amount?.button_label ?? ''}
            placeholder="Nivel inicial"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="isFeatured"
            value="true"
            defaultChecked={amount?.is_featured ?? false}
            className="size-4 accent-emerald-500"
          />
          Marcar como nivel recomendado
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" isLoading={pending}>
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
