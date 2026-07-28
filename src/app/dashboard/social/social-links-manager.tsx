'use client'

import { useState, useTransition, useActionState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Trash2, GripVertical, Eye, EyeOff,
  CheckCircle2, AlertCircle, ExternalLink, Link2, Edit3, X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  addSocialLinkAction, deleteSocialLinkAction, toggleSocialLinkAction,
  reorderSocialLinksAction, updateSocialLinkAction,
} from './actions'
import type { SocialLink } from '@/types/database.types'

type PlatformOption = { value: string; label: string }

interface Props {
  links: SocialLink[]
  limit: number
  platforms: readonly PlatformOption[]
}

export function SocialLinksManager({ links: initialLinks, limit, platforms }: Props) {
  const [links, setLinks] = useState(initialLinks)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SocialLink | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [addState, addAction, isAdding] = useActionState(addSocialLinkAction, null)

  // Drag state
  const dragIdx = useRef<number | null>(null)

  const atLimit = links.length >= limit

  // Auto-close and reload on successful add
  useEffect(() => {
    if (addState?.success) window.location.reload()
  }, [addState?.success])

  useEffect(() => {
    if (!editing) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setEditing(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editing])

  function handleSavedLink(updatedLink: Pick<SocialLink, 'id' | 'platform' | 'label' | 'url' | 'is_active'>) {
    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === updatedLink.id ? { ...link, ...updatedLink } : link
      )
    )
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este enlace?')) return
    setDeletingId(id)
    const result = await deleteSocialLinkAction(id)
    if (!result.error) setLinks((prev) => prev.filter((l) => l.id !== id))
    setDeletingId(null)
  }

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id)
    startTransition(async () => {
      const result = await toggleSocialLinkAction(id, !current)
      if (!result.error) setLinks((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !current } : l))
      setTogglingId(null)
    })
  }

  // Drag & drop handlers
  function onDragStart(idx: number) { dragIdx.current = idx }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === idx) return
    setLinks((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx.current!, 1)
      next.splice(idx, 0, moved)
      dragIdx.current = idx
      return next
    })
  }
  function onDragEnd() {
    dragIdx.current = null
    startTransition(async () => {
      await reorderSocialLinksAction(links.map((l) => l.id))
    })
  }

  const platformLabel = (val: string) => platforms.find((p) => p.value === val)?.label ?? val

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <EmptyState
          icon={Link2}
          title="Conecta el lugar donde ya te sigue tu comunidad"
          description="Un enlace es suficiente para que quien visita tu perfil pueda conocerte mejor y seguir tu trabajo."
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Añadir mi primer enlace
            </Button>
          }
        />
      )}

      <div className="space-y-2">
        {links.map((link, idx) => (
          <Card
            key={link.id}
            className="p-4 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
          >
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{platformLabel(link.platform)}</span>
                  {link.label && <span className="text-xs text-slate-500">({link.label})</span>}
                  <Badge variant={link.is_active ? 'emerald' : 'indigo'} className="text-[10px] px-1.5 py-0">
                    {link.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <a href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-emerald-500 transition truncate mt-0.5">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{link.url}</span>
                </a>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditing(link)
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                  aria-label={`Editar ${platformLabel(link.platform)}`}
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(link.id, link.is_active)}
                  disabled={togglingId === link.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label={link.is_active ? 'Desactivar' : 'Activar'}
                >
                  {link.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                  aria-label="Eliminar enlace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!showForm && !atLimit && links.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Agregar red social
        </Button>
      )}

      {atLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          Has alcanzado el límite de {limit} enlaces para tu plan actual.{' '}
          <Link href="/pricing" className="underline font-semibold">Ver planes &rarr;</Link>
        </p>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Nuevo enlace</CardTitle></CardHeader>
          <CardContent>
            <form action={addAction} className="space-y-3">
              {addState?.error && (
                <div role="alert" className="flex items-center gap-2 text-xs text-rose-500 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5" /> {addState.error}
                </div>
              )}
              {addState?.success && (
                <div role="status" className="flex items-center gap-2 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {addState.success}
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="platform" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Plataforma</label>
                <select id="platform" name="platform" required
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="socialUrl" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">URL</label>
                <input id="socialUrl" name="url" type="url" required placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="socialLabel" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Etiqueta (opcional)</label>
                <input id="socialLabel" name="label" type="text" placeholder="Ej: Mi canal de tutoriales"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isAdding}>Agregar</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editing && (
        <EditSocialLinkModal
          key={editing.id}
          link={editing}
          platforms={platforms}
          onClose={() => setEditing(null)}
          onSaved={handleSavedLink}
        />
      )}
    </div>
  )
}

function EditSocialLinkModal({
  link,
  platforms,
  onClose,
  onSaved,
}: {
  link: SocialLink
  platforms: readonly PlatformOption[]
  onClose: () => void
  onSaved: (
    link: Pick<SocialLink, 'id' | 'platform' | 'label' | 'url' | 'is_active'>
  ) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError(null)

    startSaving(async () => {
      const result = await updateSocialLinkAction(null, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.link) onSaved(result.link)
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-social-link-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <Card className="max-h-[90dvh] w-full max-w-lg overflow-y-auto p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="edit-social-link-title"
            className="font-bold text-slate-900 dark:text-white"
          >
            Editar red social
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
            aria-label="Cerrar editor"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={link.id} />

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor={`edit-platform-${link.id}`}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Plataforma
            </label>
            <select
              id={`edit-platform-${link.id}`}
              name="platform"
              required
              defaultValue={link.platform}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              {platforms.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`edit-social-url-${link.id}`}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              URL
            </label>
            <input
              id={`edit-social-url-${link.id}`}
              name="url"
              type="url"
              required
              defaultValue={link.url}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`edit-social-label-${link.id}`}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Etiqueta (opcional)
            </label>
            <input
              id={`edit-social-label-${link.id}`}
              name="label"
              type="text"
              defaultValue={link.label ?? ''}
              placeholder="Ej: Mi canal de tutoriales"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={link.is_active}
              className="size-4 accent-emerald-500"
            />
            Mostrar este enlace en el perfil público
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" isLoading={isSaving}>
              Guardar cambios
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
