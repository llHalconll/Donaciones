'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { EmojiClickData, Theme } from 'emoji-picker-react'
import { Smile, X } from 'lucide-react'

// Lazy load — ~300 KB
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] flex items-center justify-center text-slate-400 text-sm">
      <span className="animate-pulse text-2xl">😀</span>
    </div>
  ),
})

interface Props {
  /** The current emoji value */
  value: string
  onChange: (emoji: string) => void
  /** Value of the title input (controlled externally) */
  titleValue: string
  onTitleChange: (v: string) => void
  /** Form name for the emoji hidden input */
  emojiName?: string
  titleName?: string
  titleId?: string
  titlePlaceholder?: string
  titleMaxLength?: number
  titleRequired?: boolean
  titleDefaultValue?: string
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

  // Detect dark mode
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleEmojiClick = useCallback((data: EmojiClickData) => {
    onChange(data.emoji)
    setOpen(false)
    // Focus back on the title input after selecting
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onChange('')
  }, [onChange])

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Hidden emoji input for form */}
      <input type="hidden" name={emojiName} value={value} />

      {/* WhatsApp-style input bar */}
      <div
        className={`
          flex items-center gap-0 w-full
          rounded-xl border bg-slate-50 dark:bg-slate-900
          transition-all
          ${open
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 rounded-b-none border-b-slate-200 dark:border-b-slate-700'
            : 'border-slate-200 dark:border-slate-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
          }
        `}
      >
        {/* Smiley trigger — left side, like WhatsApp */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Cerrar selector de emojis' : 'Abrir selector de emojis'}
          aria-expanded={open}
          aria-controls="emoji-panel"
          className={`
            flex-shrink-0 flex items-center justify-center
            w-10 h-10 rounded-l-xl
            transition-colors
            ${open
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'
            }
          `}
        >
          {value
            ? <span className="text-lg leading-none">{value}</span>
            : <Smile className="w-5 h-5" />
          }
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

        {/* Title text input */}
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
          className="
            flex-1 px-3 py-2.5 text-sm bg-transparent
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400
            focus:outline-none
          "
        />

        {/* Clear emoji button — only when emoji is selected */}
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

      {/* Emoji panel — opens BELOW the bar, not floating */}
      {open && (
        <div
          id="emoji-panel"
          role="dialog"
          aria-label="Selector de emojis"
          className="w-full rounded-b-xl border border-t-0 border-emerald-500 overflow-hidden shadow-lg"
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

      {/* Preview text */}
      {(value || titleValue) && (
        <p className="text-xs text-slate-400 pt-1 pl-1">
          Vista previa:{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {value && <>{value} </>}{titleValue || <em>Título del botón</em>}
          </span>
        </p>
      )}
    </div>
  )
}
