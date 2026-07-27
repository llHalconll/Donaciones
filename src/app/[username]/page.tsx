import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { cache, Suspense } from 'react'
import { ArrowLeft, Globe, Heart, ShieldCheck } from 'lucide-react'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { validateUsernameFormat } from '@/lib/validations/auth'
import {
  validateHotmartUrl,
  validatePublicImageUrl,
  validatePublicUrl,
} from '@/lib/validations/url'
import { PublicAmountGrid } from './amount-grid'
import { ProfileViewTracker } from './profile-view-tracker'
import { PublicSocialLinks } from './social-links'
import { ReportButton } from './report-button'
import { ShareButton } from './share-button'

interface PageProps {
  params: Promise<{ username: string }>
}

const PUBLIC_PROFILE_FIELDS =
  'id, display_name, username, bio, avatar_url, banner_url, account_type, website_url, is_active'

const getPublicProfile = cache(async (username: string) => {
  if (!validateUsernameFormat(username).ok) {
    return { data: null, error: null }
  }

  const supabase = await createClient()
  return supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_FIELDS)
    .eq('username', username)
    .eq('is_active', true)
    .maybeSingle()
})

function getSiteUrl() {
  const fallback = 'https://donacionessaas.com'
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? fallback

  try {
    return new URL(configured).toString().replace(/\/$/, '')
  } catch {
    return fallback
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const canonicalUsername = username.toLowerCase()
  const { data: profile } = await getPublicProfile(canonicalUsername)

  if (!profile) notFound()

  const base = getSiteUrl()
  const description = (
    profile.bio ?? `Apoya a ${profile.display_name} y contribuye a que siga creando.`
  ).slice(0, 160)
  const title = `Apoya a ${profile.display_name} (@${canonicalUsername})`
  const profileImage = profile.avatar_url
    ? validatePublicImageUrl(profile.avatar_url).normalizedUrl
    : undefined
  const socialImage = profileImage ?? `${base}/og-profile.png`

  return {
    title: `${title} | DonacionesSaaS`,
    description,
    alternates: { canonical: `${base}/${canonicalUsername}` },
    openGraph: {
      title,
      description,
      images: [{
        url: socialImage,
        alt: profileImage
          ? `Foto de ${profile.display_name}`
          : 'DonacionesSaaS — Apoya a quienes crean',
      }],
      url: `${base}/${canonicalUsername}`,
      type: 'profile',
    },
    twitter: {
      card: profileImage ? 'summary' : 'summary_large_image',
      title,
      description,
      images: [socialImage],
    },
    robots: { index: true, follow: true },
  }
}

function PublicSupportLoading() {
  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6"
      aria-busy="true"
      aria-label="Cargando opciones de apoyo"
    >
      <div className="animate-pulse">
        <div className="h-3 w-24 rounded bg-emerald-500/20" />
        <div className="mt-3 h-7 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="mt-5 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <span className="sr-only">Cargando las opciones del creador…</span>
    </section>
  )
}

async function PublicSupportContent({ profileId }: { profileId: string }) {
  const supabase = await createClient()
  const [
    { data: socialLinks, error: socialLinksError },
    { data: buttons, error: buttonsError },
  ] = await Promise.all([
    supabase
      .from('social_links')
      .select('id, platform, label, url, is_active, order_index')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('order_index'),
    supabase
      .from('donation_buttons')
      .select('id, title, emoji, description, amount, currency, hotmart_checkout_url, button_label, is_active, is_featured, order_index')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('order_index'),
  ])

  const safeSocialLinks = (socialLinks ?? []).flatMap((link) => {
    const result = validatePublicUrl(link.url)
    return result.ok && result.normalizedUrl
      ? [{ ...link, url: result.normalizedUrl }]
      : []
  })
  const featuredButtonId = (buttons ?? []).find((button) => button.is_featured)?.id ?? null
  const availableButtons = (buttons ?? []).map((button) => {
    const urlResult = validateHotmartUrl(button.hotmart_checkout_url)

    return {
      ...button,
      is_featured: button.id === featuredButtonId,
      hotmart_checkout_url: urlResult.normalizedUrl ?? '',
    }
  })
  const hasValidSupportOption = availableButtons.some(
    (button) =>
      Number.isFinite(Number(button.amount)) &&
      Number(button.amount) > 0 &&
      validateHotmartUrl(button.hotmart_checkout_url).ok
  )

  return (
    <>
      <section
        id="apoyar"
        aria-labelledby="support-title"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            Apoyo directo
          </p>
          <h2 id="support-title" className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Apoya mi trabajo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Tu apoyo me ayuda a seguir creando proyectos y nuevas herramientas.
          </p>
          {!buttonsError && hasValidSupportOption && (
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Selecciona una opción para continuar.
            </p>
          )}
        </div>

        {buttonsError ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-300"
          >
            No pudimos cargar las opciones de apoyo. Intenta nuevamente más tarde.
          </div>
        ) : availableButtons.length > 0 ? (
          <PublicAmountGrid buttons={availableButtons} profileId={profileId} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <Heart className="mx-auto size-6 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Aún no hay opciones de apoyo disponibles.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Puedes volver más tarde o encontrar al creador en sus otros canales.
            </p>
          </div>
        )}

        {!buttonsError && hasValidSupportOption && (
          <div className="mt-4 flex items-start gap-2.5 px-1 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Continuarás en Hotmart para completar el pago.
              </p>
              <p className="mt-0.5 text-xs leading-relaxed">
                DonacionesSaaS no almacena tus datos de pago.
              </p>
            </div>
          </div>
        )}
      </section>

      {!socialLinksError && safeSocialLinks.length > 0 && (
        <section className="mt-12 px-1" aria-labelledby="social-title">
          <h2 id="social-title" className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Encuéntrame también en
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <PublicSocialLinks links={safeSocialLinks} />
          </div>
        </section>
      )}
    </>
  )
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const canonicalUsername = username.toLowerCase()
  const [{ data: profile, error: profileError }, { user }] = await Promise.all([
    getPublicProfile(canonicalUsername),
    getAuthUser(),
  ])

  if (profileError) {
    throw new Error('Unable to load the public profile.')
  }
  if (!profile) notFound()

  const base = getSiteUrl()
  const profileUrl = `${base}/${profile.username}`
  const initials = profile.display_name.slice(0, 2).toUpperCase()
  const safeWebsite = profile.website_url
    ? validatePublicUrl(profile.website_url).normalizedUrl ?? null
    : null
  const safeAvatar = profile.avatar_url
    ? validatePublicImageUrl(profile.avatar_url).normalizedUrl ?? null
    : null
  const safeBanner = profile.banner_url
    ? validatePublicImageUrl(profile.banner_url).normalizedUrl ?? null
    : null

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link
          href={user ? '/dashboard' : '/'}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-slate-500 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {user ? 'Ir al panel' : 'Volver al inicio'}
        </Link>
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-20">
        <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 sm:h-56">
          {safeBanner && (
            <Image
              src={safeBanner}
              alt={`Portada de ${profile.display_name}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 672px) 100vw, 672px"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
        </div>

        <div className="relative -mt-10 mb-4 px-4">
          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-slate-50 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg dark:border-slate-950">
            {safeAvatar ? (
              <Image
                src={safeAvatar}
                alt={`Foto de ${profile.display_name}`}
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            ) : (
              <span className="text-2xl font-extrabold text-white">{initials}</span>
            )}
          </div>
        </div>

        <section className="mb-7 space-y-2 px-1" aria-labelledby="creator-name">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="min-w-0">
              <h1 id="creator-name" className="break-words text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {profile.display_name}
              </h1>
              <p className="break-all font-mono text-sm text-slate-500 dark:text-slate-400">
                @{profile.username}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <ShareButton url={profileUrl} name={profile.display_name} />
              <ReportButton profileId={profile.id} profileName={profile.display_name} />
            </div>
          </div>

          {profile.bio && (
            <p className="pt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {profile.bio}
            </p>
          )}

          {safeWebsite && (
            <a
              href={safeWebsite}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Sitio web de ${profile.display_name} (abre en una pestaña nueva)`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400"
            >
              <Globe className="size-4 shrink-0" aria-hidden="true" />
              <span className="break-all">{safeWebsite.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </a>
          )}
        </section>

        <Suspense fallback={<PublicSupportLoading />}>
          <PublicSupportContent profileId={profile.id} />
        </Suspense>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-slate-400 transition-colors hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Heart className="size-3" aria-hidden="true" />
            Crea tu propia página en <strong className="ml-0.5">DonacionesSaaS</strong>
          </Link>
        </div>
      </main>

      <ProfileViewTracker profileId={profile.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': profile.account_type === 'organization' ? 'Organization' : 'Person',
            name: profile.display_name,
            url: profileUrl,
            image: safeAvatar ?? undefined,
            description: profile.bio ?? undefined,
          }).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  )
}
