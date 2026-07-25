'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { EmojiClickData, Theme } from 'emoji-picker-react'
import { Smile, X } from 'lucide-react'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] flex items-center justify-center text-slate-400">
      <span className="animate-pulse text-3xl">😀</span>
    </div>
  ),
})

interface Props {
  value: string
  onChange: (emoji: string) => void
  titleValue: string
  onTitleChange: (v: string) => void
  emojiName?: string
  titleName?: string
  titleId?: string
  titlePlaceholder?: string
  titleMaxLength?: number
  titleRequired?: boolean
}

export function EmojiTitleInput({
  value,
  onChange,
  titleValue,
  onTitleChange,
  emojiName = 'emoji',
  titleName = 'title',
  titleId = 'btnTitle',
  titlePlaceholder = 'Ej. Invítame un café',
  titleMaxLength = 80,
  titleRequired = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDark, setIsDark] = useState(false)

  // Dark mode detection
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleEmojiClick = useCallback((data: EmojiClickData) => {
    onChange(data.emoji)
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onChange('')
  }, [onChange])

  return (
    <div ref={containerRef} className="relative space-y-0">
      {/* Hidden form input */}
      <input type="hidden" name={emojiName} value={value} />

      {/* Input bar — WhatsApp style */}
      <div className={`
        flex items-center w-full
        rounded-xl border bg-slate-50 dark:bg-slate-900 transition-all
        ${open
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }
      `}>
        {/* Smiley / selected emoji — LEFT */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Cerrar selector de emojis' : 'Seleccionar emoji'}
          aria-expanded={open}
          className={`
            flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-l-xl transition-colors
            ${open
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'
            }
          `}
        >
          {value
            ? <span className="text-lg leading-none select-none">{value}</span>
            : <Smile className="w-5 h-5" />
          }
        </button>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

        {/* Title input */}
        <input
          ref={inputRef}
          id={titleId}
          name={titleName}
          type="text"
          required={titleRequired}
          maxLength={titleMaxLength}
          value={titleValue}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Clear emoji button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Eliminar emoji"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 mr-1 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preview */}
      {(value || titleValue) && (
        <p className="text-xs text-slate-400 pt-1 pl-1">
          Vista previa:{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {value && <>{value} </>}{titleValue || <em>Título del botón</em>}
          </span>
        </p>
      )}

      {/* Emoji picker — absolute dropdown, max-w-sm, attached to the bar */}
      {open && (
        <div
          role="dialog"
          aria-label="Selector de emojis"
          className="absolute z-50 top-[calc(100%+4px)] left-0 w-full max-w-sm shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
          style={{ maxWidth: 'min(350px, calc(100vw - 32px))' }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={(isDark ? 'dark' : 'light') as Theme}
            searchPlaceholder="Buscar emoji..."
            lazyLoadEmojis
            width="100%"
            height={340}
          />
        </div>
      )}
    </div>
  )
}
