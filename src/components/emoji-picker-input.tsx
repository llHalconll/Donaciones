'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { EmojiClickData, Theme } from 'emoji-picker-react'
import { Smile, X } from 'lucide-react'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="emoji-picker-shell flex items-center justify-center" style={{ height: 380 }}>
      <span className="text-3xl animate-pulse select-none">😊</span>
    </div>
  ),
})

// ─── CSS variables injected into the picker wrapper ────────────────────────
// These override emoji-picker-react's internal defaults without touching its source.
const LIGHT_VARS: React.CSSProperties = {
  '--epr-bg-color': '#ffffff',
  '--epr-category-label-bg-color': '#f8fafc',
  '--epr-text-color': '#334155',
  '--epr-hover-bg-color': '#f1f5f9',
  '--epr-focus-bg-color': '#e2e8f0',
  '--epr-search-input-bg-color': '#f1f5f9',
  '--epr-search-input-text-color': '#334155',
  '--epr-search-input-placeholder-color': '#94a3b8',
  '--epr-search-border-color': '#e2e8f0',
  '--epr-border-color': '#e2e8f0',
  '--epr-category-icon-active-color': '#10b981',
  '--epr-emoji-size': '22px',
  '--epr-emoji-gap': '2px',
  '--epr-emoji-padding': '4px',
  '--epr-header-padding': '8px 12px',
  '--epr-category-navigation-button-size': '28px',
  '--epr-preview-height': '50px',
} as React.CSSProperties

const DARK_VARS: React.CSSProperties = {
  '--epr-bg-color': '#1e293b',
  '--epr-category-label-bg-color': '#1e293b',
  '--epr-text-color': '#e2e8f0',
  '--epr-hover-bg-color': '#334155',
  '--epr-focus-bg-color': '#334155',
  '--epr-search-input-bg-color': '#0f172a',
  '--epr-search-input-text-color': '#f1f5f9',
  '--epr-search-input-placeholder-color': '#64748b',
  '--epr-search-border-color': '#334155',
  '--epr-border-color': '#334155',
  '--epr-category-icon-active-color': '#10b981',
  '--epr-emoji-size': '22px',
  '--epr-emoji-gap': '2px',
  '--epr-emoji-padding': '4px',
  '--epr-header-padding': '8px 12px',
  '--epr-category-navigation-button-size': '28px',
  '--epr-preview-height': '50px',
} as React.CSSProperties

const PICKER_HEIGHT = 370  // px — used for smart positioning
const PICKER_WIDTH  = 340  // px

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
  const [open, setOpen]         = useState(false)
  const [openUp, setOpenUp]     = useState(false)   // smart: open upward?
  const [visible, setVisible]   = useState(false)   // controls animation
  const containerRef            = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)
  const [isDark, setIsDark]     = useState(false)

  // ── Dark mode observer ────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // ── Smart positioning: decide up/down BEFORE rendering ───────────────────
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setOpenUp(spaceBelow < PICKER_HEIGHT + 8 && spaceAbove > spaceBelow)
  }, [open])

  // ── Animate in after mount ────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // tiny delay so the DOM paints before the transition starts
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    } else {
      setVisible(false)
    }
  }, [open])

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleEmojiClick = useCallback((data: EmojiClickData) => {
    onChange(data.emoji)
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onChange('')
  }, [onChange])

  const cssVars = isDark ? DARK_VARS : LIGHT_VARS

  // ── Picker popup position ─────────────────────────────────────────────────
  const popupClass = openUp
    ? 'bottom-[calc(100%+8px)]'
    : 'top-[calc(100%+8px)]'

  const transformOrigin = openUp ? 'bottom left' : 'top left'

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden form field */}
      <input type="hidden" name={emojiName} value={value} />

      {/* ── WhatsApp-style input bar ── */}
      <div className={`
        flex items-center w-full rounded-xl border bg-slate-50 dark:bg-slate-900 transition-all duration-150
        ${open
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }
      `}>
        {/* Emoji trigger — LEFT */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Cerrar selector de emojis' : 'Seleccionar emoji'}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`
            flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-l-xl
            transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
            ${open
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'
            }
          `}
        >
          {value
            ? <span className="text-lg leading-none select-none" aria-label={`Emoji seleccionado: ${value}`}>{value}</span>
            : <Smile className="w-5 h-5" aria-hidden />
          }
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" aria-hidden />

        {/* Title text input */}
        <input
          ref={inputRef}
          id={titleId}
          name={titleName}
          type="text"
          required={titleRequired}
          maxLength={titleMaxLength}
          value={titleValue}
          onChange={e => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          autoComplete="off"
          className="flex-1 px-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Clear emoji — right */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Eliminar emoji seleccionado"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 mr-1 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preview */}
      {(value || titleValue) && (
        <p className="text-xs text-slate-400 pt-1.5 pl-1">
          Vista previa:{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {value && <>{value}{' '}</>}
            {titleValue || <em className="font-normal text-slate-400">Título del botón</em>}
          </span>
        </p>
      )}

      {/* ── Emoji picker popup ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Selector de emojis"
          aria-modal="true"
          className={`
            absolute ${popupClass} left-0 z-50
            rounded-2xl overflow-hidden
            border border-slate-200 dark:border-slate-700
            shadow-2xl shadow-slate-900/20 dark:shadow-slate-950/60
            transition-all duration-200 ease-out
            ${visible
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
            }
          `}
          style={{
            width: PICKER_WIDTH,
            maxWidth: 'calc(100vw - 32px)',
            transformOrigin,
          }}
        >
          {/* Custom-styled picker wrapper */}
          <div
            style={cssVars}
            className="emoji-picker-wrapper"
          >
            {/* ── "Ninguno" option — selectable like any emoji ── */}
            <div className={`flex items-center gap-2 px-3 py-2 border-b ${isDark ? 'border-slate-700/60 bg-slate-900' : 'border-slate-100 bg-slate-50/60'}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Opción
              </span>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                aria-label="Sin emoji (ninguno)"
                aria-pressed={!value}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                  border transition-all duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                  ${!value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : isDark
                      ? 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-white'
                  }
                `}
              >
                {/* Empty square representing "no emoji" */}
                <span className={`
                  inline-flex items-center justify-center w-5 h-5 rounded border text-[10px] font-mono leading-none
                  ${!value
                    ? 'border-emerald-400 text-emerald-500'
                    : isDark ? 'border-slate-600 text-slate-600' : 'border-slate-300 text-slate-300'
                  }
                `}>∅</span>
                Ninguno
                {!value && <span className="text-emerald-500 text-[10px]">✓</span>}
              </button>
            </div>

            {/*
              Global CSS for the picker is injected via a <style> tag below.
              We target `.emoji-picker-wrapper .EmojiPickerReact` to scope it.
            */}
            <style>{`
              .emoji-picker-wrapper .EmojiPickerReact {
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                font-family: inherit !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact .epr-header {
                padding: 8px 10px 6px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact input.epr-search {
                border-radius: 10px !important;
                font-size: 13px !important;
                padding: 7px 12px !important;
                height: 34px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact .epr-emoji-category-label {
                font-size: 10px !important;
                font-weight: 700 !important;
                letter-spacing: 0.06em !important;
                text-transform: uppercase !important;
                padding: 6px 10px 2px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact button.epr-emoji {
                border-radius: 8px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact button.epr-emoji:focus-visible {
                outline: 2px solid #10b981 !important;
                outline-offset: 1px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact .epr-category-nav {
                padding: 4px 8px !important;
                gap: 2px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact .epr-category-nav button {
                border-radius: 6px !important;
                width: 28px !important;
                height: 28px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact ::-webkit-scrollbar {
                width: 4px !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact ::-webkit-scrollbar-track {
                background: transparent !important;
              }
              .emoji-picker-wrapper .EmojiPickerReact ::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 99px !important;
              }
              .dark .emoji-picker-wrapper .EmojiPickerReact ::-webkit-scrollbar-thumb {
                background: #334155 !important;
              }
            `}</style>

            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={(isDark ? 'dark' : 'light') as Theme}
              searchPlaceholder="Buscar emoji..."
              lazyLoadEmojis
              emojiStyle={'native' as never}
              skinTonesDisabled={false}
              width={PICKER_WIDTH}
              height={PICKER_HEIGHT}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
