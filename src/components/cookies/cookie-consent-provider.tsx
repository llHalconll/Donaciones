'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { BarChart3, Cookie, Palette, ShieldCheck, X } from 'lucide-react'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_POLICY_VERSION,
  OPEN_COOKIE_SETTINGS_EVENT,
  clearDeclinedBrowserStorage,
  getStoredCookieConsent,
  type CookieCategories,
  type CookieConsentMethod,
  type CookieConsentRecord,
  type OptionalCookieCategory,
} from '@/lib/cookie-consent'

interface CookieConsentContextValue {
  consent: CookieConsentRecord | null
  hasConsent: (category: OptionalCookieCategory) => boolean
  openPreferences: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue>({
  consent: null,
  hasConsent: () => false,
  openPreferences: () => {},
})

const NECESSARY_ONLY: CookieCategories = {
  necessary: true,
  preferences: false,
  analytics: false,
}

const ALL_OPTIONAL: CookieCategories = {
  necessary: true,
  preferences: true,
  analytics: true,
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [consent, setConsent] = useState<CookieConsentRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<CookieCategories>(NECESSARY_ONLY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogMethod, setDialogMethod] =
    useState<CookieConsentMethod>('preferences_save')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dialogTitleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = getStoredCookieConsent()
      setConsent(stored)
      setDraft(stored?.categories ?? NECESSARY_ONLY)
      if (stored) clearDeclinedBrowserStorage(stored.categories)
      setReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const openPreferences = useCallback(() => {
    setDraft(consent?.categories ?? NECESSARY_ONLY)
    setDialogMethod(consent ? 'footer_preferences' : 'preferences_save')
    setError(null)
    setDialogOpen(true)
  }, [consent])

  useEffect(() => {
    const handleOpen = () => openPreferences()
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpen)
  }, [openPreferences])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (dialogOpen && !dialog.open) {
      dialog.showModal()
      requestAnimationFrame(() => dialogTitleRef.current?.focus())
    } else if (!dialogOpen && dialog.open) {
      dialog.close()
    }
  }, [dialogOpen])

  const saveConsent = useCallback(
    async (categories: CookieCategories, method: CookieConsentMethod) => {
      setSaving(true)
      setError(null)

      try {
        const response = await fetch('/api/cookie-consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version: COOKIE_POLICY_VERSION,
            categories,
            method,
          }),
        })

        const result: unknown = await response.json()
        if (
          !response.ok ||
          !result ||
          typeof result !== 'object' ||
          typeof (result as Record<string, unknown>).recordedAt !== 'string' ||
          typeof (result as Record<string, unknown>).expiresAt !== 'string'
        ) {
          throw new Error('Unable to record cookie preferences')
        }

        const nextConsent: CookieConsentRecord = {
          version: COOKIE_POLICY_VERSION,
          categories,
          method,
          recordedAt: (result as { recordedAt: string }).recordedAt,
          expiresAt: (result as { expiresAt: string }).expiresAt,
        }

        localStorage.setItem(
          COOKIE_CONSENT_STORAGE_KEY,
          JSON.stringify(nextConsent)
        )
        if (categories.preferences && !localStorage.getItem('theme')) {
          localStorage.setItem(
            'theme',
            document.documentElement.classList.contains('dark')
              ? 'dark'
              : 'light'
          )
        }
        clearDeclinedBrowserStorage(categories)
        setConsent(nextConsent)
        setDraft(categories)
        setDialogOpen(false)
        window.dispatchEvent(
          new CustomEvent<CookieConsentRecord>(
            COOKIE_CONSENT_CHANGED_EVENT,
            { detail: nextConsent }
          )
        )
      } catch {
        setError(
          'No pudimos guardar tu decisión. Revisa tu conexión e inténtalo nuevamente.'
        )
      } finally {
        setSaving(false)
      }
    },
    []
  )

  const hasConsent = useCallback(
    (category: OptionalCookieCategory) =>
      consent?.categories[category] === true,
    [consent]
  )

  return (
    <CookieConsentContext.Provider
      value={{ consent, hasConsent, openPreferences }}
    >
      {children}

      {ready && !consent && (
        <section
          aria-labelledby="cookie-banner-title"
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900 sm:inset-x-6 sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:flex">
              <Cookie className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="cookie-banner-title"
                className="text-base font-bold text-slate-950 dark:text-white"
              >
                Tu privacidad y tus preferencias
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Usamos tecnologías necesarias para autenticarte y proteger el
                servicio. Con tu permiso, también guardamos el tema, medimos el
                uso de perfiles y habilitamos el widget integrado de Hotmart.{' '}
                <Link
                  href="/cookies"
                  className="font-semibold text-emerald-700 underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400"
                >
                  Política de Cookies
                </Link>
              </p>
              {error && (
                <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveConsent(
                  NECESSARY_ONLY,
                  'banner_reject_nonessential'
                )
              }
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Rechazar no esenciales
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={openPreferences}
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Configurar preferencias
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void saveConsent(ALL_OPTIONAL, 'banner_accept_all')
              }
              className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:text-slate-950"
            >
              Aceptar todas
            </button>
          </div>
        </section>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="cookie-preferences-title"
        onCancel={(event) => {
          event.preventDefault()
          setDialogOpen(false)
        }}
        onClose={() => setDialogOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDialogOpen(false)
        }}
        className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                ref={dialogTitleRef}
                id="cookie-preferences-title"
                tabIndex={-1}
                className="text-xl font-bold focus:outline-none"
              >
                Configurar cookies
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Puedes cambiar esta decisión en cualquier momento desde el pie
                de página.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
              aria-label="Cerrar configuración de cookies"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <CategoryRow
              icon={ShieldCheck}
              title="Necesarias"
              description="Autenticación, seguridad, sesión y conservación de tu decisión. Siempre activas."
              checked
              disabled
              onChange={() => {}}
            />
            <CategoryRow
              icon={Palette}
              title="Preferencias"
              description="Recuerda el modo claro u oscuro en futuras visitas."
              checked={draft.preferences}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...current,
                  preferences: checked,
                }))
              }
            />
            <CategoryRow
              icon={BarChart3}
              title="Analíticas"
              description="Mide visitas e interacciones de forma seudónima y permite cargar el widget integrado de Hotmart."
              checked={draft.analytics}
              onChange={(checked) =>
                setDraft((current) => ({ ...current, analytics: checked }))
              }
            />
          </div>

          {error && (
            <p className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href="/cookies"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Ver Política de Cookies
            </Link>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveConsent(draft, dialogMethod)}
              className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:text-slate-950"
            >
              {saving ? 'Guardando…' : 'Guardar preferencias'}
            </button>
          </div>
        </div>
      </dialog>
    </CookieConsentContext.Provider>
  )
}

function CategoryRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  icon: typeof ShieldCheck
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  const inputId = `cookie-category-${title.toLowerCase()}`

  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-300">
          {description}
        </span>
      </span>
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 shrink-0 accent-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      />
    </label>
  )
}

export function useCookieConsent() {
  return useContext(CookieConsentContext)
}
