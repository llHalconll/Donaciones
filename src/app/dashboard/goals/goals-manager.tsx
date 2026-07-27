'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonStyles } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { SupportGoal } from '@/types/database.types'
import type { MoveDirection } from '@/lib/support-goals'
import {
  createSupportGoalAction,
  deleteSupportGoalAction,
  duplicateSupportGoalAction,
  moveSupportGoalAction,
  toggleSupportGoalAction,
  updateSupportGoalAction,
  type ActionResult,
} from './actions'

type ManagedGoal = SupportGoal & { amount_count: number }

interface Props {
  goals: ManagedGoal[]
  limit: number
}

export function GoalsManager({ goals, limit }: Props) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ManagedGoal | null>(null)
  const [message, setMessage] = useState<ActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  const atLimit = goals.length >= limit

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
    run(
      () => createSupportGoalAction(new FormData(form)),
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
    run(() => updateSupportGoalAction(formData), () => setEditing(null))
  }

  function handleDelete(goal: ManagedGoal) {
    if (
      !window.confirm(
        `¿Eliminar "${goal.title}" y sus ${goal.amount_count} niveles? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    run(() => deleteSupportGoalAction(goal.id))
  }

  function handleMove(id: string, direction: MoveDirection) {
    run(() => moveSupportGoalAction(id, direction))
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

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Crea tu primer objetivo de apoyo"
          description="Define una causa concreta y luego añade los niveles que conectarán con sus checkouts de Hotmart."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Crear objetivo
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={goal.id} className="space-y-3">
              <Card className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex shrink-0 flex-col gap-1"
                    role="group"
                    aria-label={`Orden de ${goal.title}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleMove(goal.id, 'up')}
                      disabled={pending || index === 0}
                      className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:hover:bg-slate-800"
                      aria-label={`Mover "${goal.title}" arriba`}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(goal.id, 'down')}
                      disabled={pending || index === goals.length - 1}
                      className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-30 dark:hover:bg-slate-800"
                      aria-label={`Mover "${goal.title}" abajo`}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  {goal.cover_url ? (
                    <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:block dark:bg-slate-800">
                      <Image
                        src={goal.cover_url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span
                      className="hidden size-20 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-3xl sm:flex"
                      aria-hidden="true"
                    >
                      {goal.emoji || '♥'}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        {goal.emoji || '♥'}
                      </span>
                      <h2 className="break-words font-bold text-slate-900 dark:text-white">
                        {goal.title}
                      </h2>
                      <Badge variant={goal.is_active ? 'emerald' : 'slate'}>
                        {goal.is_active ? 'Activo' : 'Borrador'}
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {goal.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {goal.amount_count}{' '}
                      {goal.amount_count === 1 ? 'nivel configurado' : 'niveles configurados'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/goals/${goal.id}`}
                        className={buttonStyles({ size: 'sm' })}
                      >
                        Administrar niveles
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditing(editing?.id === goal.id ? null : goal)
                        }
                        disabled={pending}
                        aria-expanded={editing?.id === goal.id}
                        aria-controls={`edit-form-${goal.id}`}
                      >
                        <Edit3 className="size-4" aria-hidden="true" />
                        {editing?.id === goal.id ? 'Cerrar editor' : 'Editar'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          run(() => duplicateSupportGoalAction(goal.id))
                        }
                        disabled={pending || atLimit}
                      >
                        <Copy className="size-4" aria-hidden="true" />
                        Duplicar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          run(() =>
                            toggleSupportGoalAction(goal.id, !goal.is_active)
                          )
                        }
                        disabled={pending}
                      >
                        {goal.is_active ? (
                          <EyeOff className="size-4" aria-hidden="true" />
                        ) : (
                          <Eye className="size-4" aria-hidden="true" />
                        )}
                        {goal.is_active ? 'Ocultar' : 'Activar'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(goal)}
                        disabled={pending}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {editing?.id === goal.id && (
                <div id={`edit-form-${goal.id}`} role="region" aria-label={`Editor de: ${goal.title}`}>
                  <GoalForm
                    key={goal.id}
                    title={`Editar: ${editing.title}`}
                    submitLabel="Guardar cambios"
                    pending={pending}
                    goal={editing}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!showCreate && goals.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCreate(true)}
          disabled={atLimit}
        >
          <Plus className="size-4" aria-hidden="true" />
          {atLimit ? `Límite de ${limit} objetivos alcanzado` : 'Nuevo objetivo'}
        </Button>
      )}

      {showCreate && (
        <GoalForm
          title="Nuevo objetivo"
          submitLabel="Crear objetivo"
          pending={pending}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

function GoalForm({
  title,
  submitLabel,
  pending,
  goal,
  onSubmit,
  onCancel,
}: {
  title: string
  submitLabel: string
  pending: boolean
  goal?: ManagedGoal
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
        <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
          <div>
            <label
              htmlFor={`goal-emoji-${goal?.id ?? 'new'}`}
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Emoji
            </label>
            <input
              id={`goal-emoji-${goal?.id ?? 'new'}`}
              name="emoji"
              type="text"
              maxLength={32}
              defaultValue={goal?.emoji ?? ''}
              placeholder="☕"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-center text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label
              htmlFor={`goal-title-${goal?.id ?? 'new'}`}
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              id={`goal-title-${goal?.id ?? 'new'}`}
              name="title"
              type="text"
              required
              maxLength={80}
              defaultValue={goal?.title ?? ''}
              placeholder="Invítame un café"
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`goal-description-${goal?.id ?? 'new'}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Descripción
          </label>
          <textarea
            id={`goal-description-${goal?.id ?? 'new'}`}
            name="description"
            rows={3}
            maxLength={160}
            defaultValue={goal?.description ?? ''}
            placeholder="Explica brevemente cómo ayudará este apoyo."
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div>
          <label
            htmlFor={`goal-cover-${goal?.id ?? 'new'}`}
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Imagen opcional
          </label>
          <label
            htmlFor={`goal-cover-${goal?.id ?? 'new'}`}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 text-sm text-slate-500 hover:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-slate-700 dark:text-slate-400"
          >
            <ImageIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>JPG, PNG o WebP · máximo 5 MB</span>
            <input
              id={`goal-cover-${goal?.id ?? 'new'}`}
              name="cover"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
            />
          </label>
          {goal?.cover_url && (
            <label className="mt-2 flex min-h-11 items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                name="removeCover"
                value="true"
                className="size-4 accent-emerald-500"
              />
              Eliminar la imagen actual
            </label>
          )}
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={goal?.is_active ?? true}
            className="size-4 accent-emerald-500"
          />
          Mostrar este objetivo en el perfil público
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
