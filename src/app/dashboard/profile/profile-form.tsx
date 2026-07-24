'use client'

import { useActionState, useState, useCallback, useTransition } from 'react'
import { User, Save, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AvatarUploader } from '@/components/dashboard/avatar-uploader'
import { BannerUploader } from '@/components/dashboard/banner-uploader'
import { ProfilePreviewCard } from '@/components/dashboard/profile-preview-card'
import { updateProfileAction, checkUsernameAvailabilityAction } from './actions'
import { validateUsernameFormat } from '@/lib/validations/auth'
import type { Profile } from '@/types/database.types'

interface ProfileFormProps {
  profile: Profile | null
  userId: string
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [formState, formAction, isPending] = useActionState(updateProfileAction, null)

  // Controlled field state for live preview & validation
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')

  // Image URLs refreshed after upload (passed down to uploaders + preview)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile?.banner_url ?? null)

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [, startCheckTransition] = useTransition()

  const checkUsername = useCallback(
    (value: string) => {
      const cleaned = value.toLowerCase().replace(/\s+/g, '')
      setUsername(cleaned)

      if (!cleaned || cleaned === profile?.username) {
        setUsernameStatus('idle')
        setUsernameError(null)
        return
      }

      const fmt = validateUsernameFormat(cleaned)
      if (!fmt.ok) {
        setUsernameStatus('invalid')
        setUsernameError(fmt.error ?? 'Formato inválido.')
        return
      }

      setUsernameStatus('checking')
      setUsernameError(null)

      startCheckTransition(async () => {
        const result = await checkUsernameAvailabilityAction(cleaned, userId)
        if (result.error) {
          setUsernameStatus('invalid')
          setUsernameError(result.error)
        } else {
          setUsernameStatus(result.available ? 'available' : 'taken')
          setUsernameError(result.available ? null : `"@${cleaned}" ya está en uso.`)
        }
      })
    },
    [profile?.username, userId]
  )

  const usernameHint = () => {
    if (usernameStatus === 'checking')
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando disponibilidad…
        </span>
      )
    if (usernameStatus === 'available')
      return (
        <span className="flex items-center gap-1 text-emerald-500">
          <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
        </span>
      )
    if (usernameStatus === 'taken' || usernameStatus === 'invalid')
      return (
        <span className="flex items-center gap-1 text-rose-500" role="alert">
          <AlertCircle className="w-3.5 h-3.5" /> {usernameError}
        </span>
      )
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* ── LEFT: Form ── */}
      <form action={formAction} className="lg:col-span-2 space-y-6">
        {/* Hidden field: username included here so formData sees it */}
        <input type="hidden" name="username" value={username} />

        {/* Status Banners */}
        {formState?.error && (
          <div
            role="alert"
            className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {formState.error}
          </div>
        )}
        {formState?.success && (
          <div
            role="status"
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {formState.success}
          </div>
        )}

        {/* ── Image uploads ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
              Imágenes de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <BannerUploader currentUrl={bannerUrl} onUpdate={setBannerUrl} />
            <AvatarUploader
              currentUrl={avatarUrl}
              displayName={displayName}
              onUpdate={setAvatarUrl}
            />
          </CardContent>
        </Card>

        {/* ── Text fields ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-emerald-500" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nombre visible <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    displayName.length > 55 ? 'text-rose-500' : 'text-slate-400'
                  }`}
                >
                  {displayName.length}/60
                </span>
              </div>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Alex Creator"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                aria-required="true"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="usernameDisplay"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Usuario (URL pública) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs tabular-nums text-slate-400">
                  {username.length}/30
                </span>
              </div>

              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition">
                <span className="pl-3.5 pr-1 text-xs font-mono text-slate-400 select-none whitespace-nowrap">
                  /
                </span>
                <input
                  id="usernameDisplay"
                  type="text"
                  required
                  maxLength={30}
                  value={username}
                  onChange={(e) => checkUsername(e.target.value)}
                  placeholder="tu_usuario"
                  className="flex-1 py-2.5 pr-3.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  aria-required="true"
                  aria-describedby="username-hint"
                />
              </div>

              <div id="username-hint" className="text-xs min-h-[1.25rem]">
                {usernameHint() ?? (
                  <span className="flex items-center gap-1 text-slate-400">
                    <LinkIcon className="w-3.5 h-3.5" />
                    URL pública: /{username || 'tu_usuario'}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="bio"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Biografía
                </label>
                <span
                  className={`text-xs tabular-nums ${
                    bio.length > 230 ? 'text-rose-500' : 'text-slate-400'
                  }`}
                >
                  {bio.length}/250
                </span>
              </div>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                maxLength={250}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntale a tus donantes sobre ti…"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            disabled={isPending || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
            className="min-w-[160px]"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      {/* ── RIGHT: Live Preview ── */}
      <div className="lg:col-span-1 space-y-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Vista previa
        </p>
        <ProfilePreviewCard
          displayName={displayName}
          username={username}
          bio={bio}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
        />
        <p className="text-xs text-slate-400 text-center">
          Así verán tu perfil los donantes
        </p>
      </div>
    </div>
  )
}
