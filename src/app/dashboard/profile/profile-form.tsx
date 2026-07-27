'use client'

import { useActionState, useState, useCallback, useTransition } from 'react'
import {
  User, Save, CheckCircle2, AlertCircle, Loader2, Link as LinkIcon,
  Building2, UserCircle2, Globe,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AvatarUploader } from '@/components/dashboard/avatar-uploader'
import { BannerUploader } from '@/components/dashboard/banner-uploader'
import { ProfilePreviewCard } from '@/components/dashboard/profile-preview-card'
import {
  updateProfileAction,
  checkUsernameAvailabilityAction,
} from './actions'
import { validateUsernameFormat } from '@/lib/validations/auth'
import type { Profile, AccountType } from '@/types/database.types'

interface ProfileFormProps {
  profile: Profile | null
  userId: string
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string; icon: typeof UserCircle2; desc: string }[] = [
  { value: 'individual', label: 'Persona / Creador', icon: UserCircle2, desc: 'Para personas naturales, creadores, profesionales independientes.' },
  { value: 'organization', label: 'Organización', icon: Building2, desc: 'Para empresas, iglesias, fundaciones, asociaciones y proyectos.' },
]

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [formState, formAction, isPending] = useActionState(updateProfileAction, null)

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [accountType, setAccountType] = useState<AccountType>(profile?.account_type ?? 'individual')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(profile?.banner_url ?? null)

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [, startCheckTransition] = useTransition()

  const checkUsername = useCallback(
    (value: string) => {
      const cleaned = value.toLowerCase().replace(/\s+/g, '')
      setUsername(cleaned)
      if (!cleaned || cleaned === profile?.username) {
        setUsernameStatus('idle'); setUsernameError(null); return
      }
      const fmt = validateUsernameFormat(cleaned)
      if (!fmt.ok) { setUsernameStatus('invalid'); setUsernameError(fmt.error ?? null); return }
      setUsernameStatus('checking'); setUsernameError(null)
      startCheckTransition(async () => {
        const result = await checkUsernameAvailabilityAction(cleaned, userId)
        if (result.error) { setUsernameStatus('invalid'); setUsernameError(result.error) }
        else { setUsernameStatus(result.available ? 'available' : 'taken'); setUsernameError(result.available ? null : `"@${cleaned}" ya está en uso.`) }
      })
    },
    [profile?.username, userId]
  )

  const usernameStatusUI = () => {
    if (usernameStatus === 'checking') return <span className="flex items-center gap-1 text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando…</span>
    if (usernameStatus === 'available') return <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Disponible</span>
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return <span className="flex items-center gap-1 text-rose-500" role="alert"><AlertCircle className="w-3.5 h-3.5" /> {usernameError}</span>
    return <span className="flex items-center gap-1 text-slate-400"><LinkIcon className="w-3.5 h-3.5" /> /{username || 'tu_usuario'}</span>
  }

  const canSubmit = !isPending && usernameStatus !== 'checking' && usernameStatus !== 'taken' && usernameStatus !== 'invalid'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* ── LEFT: Form ── */}
      <form action={formAction} className="lg:col-span-2 space-y-6">
        <input type="hidden" name="username" value={username} />
        <input type="hidden" name="accountType" value={accountType} />

        {formState?.error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{formState.error}
          </div>
        )}
        {formState?.success && (
          <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{formState.success}
          </div>
        )}

        {/* Images */}
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-700 dark:text-slate-300">Imágenes de Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <BannerUploader currentUrl={bannerUrl} onUpdate={setBannerUrl} />
            <AvatarUploader currentUrl={avatarUrl} displayName={displayName} onUpdate={setAvatarUrl} />
          </CardContent>
        </Card>

        {/* Account Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-indigo-500" /> Tipo de cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCOUNT_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = accountType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccountType(opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Text Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-emerald-500" /> Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Display Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="displayName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {accountType === 'organization' ? 'Nombre de la organización' : 'Nombre visible'} <span className="text-rose-500">*</span>
                </label>
                <span className={`text-xs tabular-nums ${displayName.length > 55 ? 'text-rose-500' : 'text-slate-400'}`}>{displayName.length}/60</span>
              </div>
              <input
                id="displayName" name="displayName" type="text" required maxLength={60}
                value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder={accountType === 'organization' ? 'Ej. Fundación Esperanza' : 'Ej. Alex Creator'}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                aria-required="true"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="usernameDisplay" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Usuario (URL pública) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs tabular-nums text-slate-400">{username.length}/30</span>
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 transition">
                <span className="pl-3.5 pr-1 text-xs font-mono text-slate-400 select-none whitespace-nowrap">/</span>
                <input
                  id="usernameDisplay" type="text" required maxLength={30}
                  value={username} onChange={(e) => checkUsername(e.target.value)}
                  placeholder="tu_usuario"
                  className="flex-1 py-2.5 pr-3.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  aria-required="true" aria-describedby="username-hint"
                />
              </div>
              <div id="username-hint" className="text-xs min-h-[1.25rem]">{usernameStatusUI()}</div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="bio" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {accountType === 'organization' ? 'Descripción de la organización' : 'Biografía'}
                </label>
                <span className={`text-xs tabular-nums ${bio.length > 230 ? 'text-rose-500' : 'text-slate-400'}`}>{bio.length}/250</span>
              </div>
              <textarea
                id="bio" name="bio" rows={4} maxLength={250}
                value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder={accountType === 'organization' ? 'Describe la misión y propósito de tu organización…' : 'Cuéntale a tus donantes sobre ti…'}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
              />
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <label htmlFor="websiteUrl" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Globe className="w-3.5 h-3.5" /> Sitio web (opcional)
              </label>
              <input
                id="websiteUrl" name="websiteUrl" type="url"
                value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://tusitio.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isPending} disabled={!canSubmit} className="min-w-[160px]">
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      {/* ── RIGHT: Live Preview ── */}
      <div className="lg:col-span-1 space-y-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vista previa</p>
        <ProfilePreviewCard
          displayName={displayName} username={username} bio={bio}
          accountType={accountType} websiteUrl={websiteUrl}
          avatarUrl={avatarUrl} bannerUrl={bannerUrl}
        />
        <p className="text-xs text-slate-400 text-center">Así verán tu perfil los visitantes</p>
      </div>
    </div>
  )
}
