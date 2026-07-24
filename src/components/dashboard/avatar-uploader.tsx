'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { validateImageFile, processImage } from '@/lib/utils/image-processor'
import { uploadAvatarAction } from '@/app/dashboard/profile/actions'

interface AvatarUploaderProps {
  currentUrl: string | null
  displayName: string
  onUpdate?: (url: string) => void
}

export function AvatarUploader({ currentUrl, displayName, onUpdate }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const [clientError, setClientError] = useState<string | null>(null)
  const [serverMessage, setServerMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const initials = displayName.trim().slice(0, 2).toUpperCase() || 'CR'

  async function handleFile(file: File) {
    setClientError(null)
    setServerMessage(null)

    const validation = validateImageFile(file, 2)
    if (!validation.ok) {
      setClientError(validation.error ?? 'Archivo inválido.')
      return
    }

    let processed
    try {
      processed = await processImage(file, 512, 512, 0.85)
    } catch {
      setClientError('No se pudo procesar la imagen.')
      return
    }

    setPreviewUrl(processed.previewUrl)

    const fd = new FormData()
    fd.append('avatar', processed.blob, 'avatar.webp')

    startTransition(async () => {
      const result = await uploadAvatarAction(null, fd)
      if (result.error) {
        setServerMessage({ ok: false, text: result.error })
      } else {
        setServerMessage({ ok: true, text: result.success ?? 'Avatar actualizado.' })
        if (onUpdate && processed?.previewUrl) onUpdate(processed.previewUrl)
      }
    })
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Cambiar foto de perfil"
        className="relative w-20 h-20 rounded-full flex-shrink-0 overflow-hidden border-2 border-emerald-500 bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 hover:opacity-90 transition group"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Avatar de perfil"
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {initials}
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          {isPending ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {/* Info & button */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Foto de Perfil (Avatar)
        </p>
        <p className="text-xs text-slate-400">JPG, PNG o WebP · máx. 2 MB · 512×512 px recomendado</p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {isPending ? 'Subiendo…' : 'Cambiar imagen'}
        </button>

        {clientError && (
          <p role="alert" className="text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {clientError}
          </p>
        )}
        {serverMessage && (
          <p
            role="status"
            className={`text-xs flex items-center gap-1 ${serverMessage.ok ? 'text-emerald-500' : 'text-rose-500'}`}
          >
            {serverMessage.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            {serverMessage.text}
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
