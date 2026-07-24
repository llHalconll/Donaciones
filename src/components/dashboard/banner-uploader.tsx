'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, Loader2, CheckCircle2, AlertCircle, ImagePlus } from 'lucide-react'
import { validateImageFile, processImage } from '@/lib/utils/image-processor'
import { uploadBannerAction } from '@/app/dashboard/profile/actions'

interface BannerUploaderProps {
  currentUrl: string | null
  onUpdate?: (url: string) => void
}

export function BannerUploader({ currentUrl, onUpdate }: BannerUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const [clientError, setClientError] = useState<string | null>(null)
  const [serverMessage, setServerMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFile(file: File) {
    setClientError(null)
    setServerMessage(null)

    const validation = validateImageFile(file, 5)
    if (!validation.ok) {
      setClientError(validation.error ?? 'Archivo inválido.')
      return
    }

    let processed
    try {
      processed = await processImage(file, 1600, 600, 0.87)
    } catch {
      setClientError('No se pudo procesar la imagen.')
      return
    }

    setPreviewUrl(processed.previewUrl)

    const fd = new FormData()
    fd.append('banner', processed.blob, 'banner.webp')

    startTransition(async () => {
      const result = await uploadBannerAction(null, fd)
      if (result.error) {
        setServerMessage({ ok: false, text: result.error })
      } else {
        setServerMessage({ ok: true, text: result.success ?? 'Banner actualizado.' })
        if (onUpdate && processed?.previewUrl) onUpdate(processed.previewUrl)
      }
    })
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        Imagen de Portada (Banner)
      </label>

      {/* Preview / Drop Zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Cambiar imagen de portada"
        className="relative w-full h-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition group focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Banner de perfil"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/15 via-indigo-500/15 to-slate-500/10 flex flex-col items-center justify-center gap-2 text-slate-400">
            <ImagePlus className="w-7 h-7" />
            <span className="text-xs">Haz clic para subir un banner</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          {isPending ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-white" />
          )}
        </div>
      </button>

      <p className="text-xs text-slate-400">
        JPG, PNG o WebP · máx. 5 MB · 1600×600 px recomendado
      </p>

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
