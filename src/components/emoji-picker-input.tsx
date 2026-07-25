'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { EmojiClickData, Theme } from 'emoji-picker-react'

// Load picker lazily — it's heavy (~300 KB)
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <span className="text-2xl animate-pulse">😀</span>
    </div>
  ),
})

interface Props {
  /** Current emoji value (controlled from parent) */
  value: string
  onChange: (emoji: string) => void
  /** Name for the hidden <input> submitted in the form */
  name?: string
}

export function EmojiPickerInput({ value, onChange, name = 'emoji' }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect dark mode for the picker theme
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(document.documentElement.classList.contains('dark') || mql.matches)
    const handler = () => setIsDark(document.documentElement.classList.contains('dark') || mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const handleEmojiClick = useCallback((data: EmojiClickData) => {
    onChange(data.emoji)
    setOpen(false)
  }, [onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }, [onChange])

  return (
    <>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={value ? `Emoji seleccionado: ${value}. Clic para cambiar.` : 'Seleccionar emoji'}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`
            flex items-center justify-center w-9 h-9 rounded-lg text-lg
            transition-colors border
            ${open
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }
          `}
        >
          {value || '😀'}
        </button>

        {/* Clear button — only when emoji is selected */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Eliminar emoji"
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold hover:bg-rose-600 transition z-10"
          >
            ✕
          </button>
        )}

        {/* Picker popover */}
        {open && (
          <div
            role="dialog"
            aria-label="Selector de emojis"
            className="absolute z-50 mt-2 right-0 sm:left-0 sm:right-auto shadow-2xl rounded-2xl overflow-hidden"
            style={{ maxWidth: 'min(350px, calc(100vw - 32px))' }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={(isDark ? 'dark' : 'light') as Theme}
              searchPlaceholder="Buscar emoji..."
              lazyLoadEmojis
              skinTonesDisabled={false}
              width="100%"
              height={380}
            />
          </div>
        )}
      </div>
    </>
  )
}
