import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { cache, Suspense } from 'react'
import { ArrowLeft, Globe, Heart, ShieldCheck } from 'lucide-react'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { resolveSiteUrl } from '@/lib/site-url'
import { validateUsernameFormat } from '@/lib/validations/auth'
import {
  validateHotmartUrl,
  validatePublicImageUrl,
  validatePublicUrl,
} from '@/lib/validations/url'
import { PublicSupportGoals } from './support-goals'
import { EmptyState } from '@/components/ui/empty-state'
import { ProfileViewTracker } from './profile-view-tracker'
import { PublicSocialLinks } from './social-links'
import { ReportButton } from './report-button'
import { ShareButton } from './share-button'
import { getSupportEmptyStateCopy } from '@/lib/support-goals'

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const canonicalUsername = username.toLowerCase()
  const { data: profile } = await getPublicProfile(canonicalUsername)

  if (!profile) notFound()

  const base = resolveSiteUrl()
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
      className="border-t border-slate-200/80 pt-5 dark:border-slate-800"
      aria-busy="true"
      aria-label="Cargando opciones de apoyo"
    >
      <div className="animate-pulse">
        <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3.5 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="h-[4.5rem] bg-slate-100 dark:bg-slate-900" />
          <div className="h-[4.5rem] border-t border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
      <span className="sr-only">Cargando las opciones del creador…</span>
    </section>
  )
}

async function PublicSupportContent({
  profileId,
  creatorName,
  hasWebsite,
}: {
  profileId: string
  creatorName: string
  hasWebsite: boolean
}) {
  const supabase = await createClient()
  const [
    { data: socialLinks, error: socialLinksError },
    { data: goals, error: goalsError },
  ] = await Promise.all([
    supabase
      .from('social_links')
      .select('id, platform, label, url, is_active, order_index')
      .eq('profile_id', profileId)
      .eq('is_active', true)
      .order('order_index'),
    supabase
      .from('support_goals')
      .select(`
        id,
        emoji,
        title,
        description,
        cover_url,
        is_active,
        order_index,
        support_amounts (
          id,
          goal_id,
          amount,
          currency,
          hotmart_checkout_url,
          button_label,
          is_featured,
          order_index
        )
      `)
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
  const availableGoals = (goals ?? [])
    .map((goal) => {
      const { support_amounts: supportAmounts, ...goalFields } = goal
      return {
        ...goalFields,
        cover_url: goal.cover_url
          ? validatePublicImageUrl(goal.cover_url).normalizedUrl ?? null
          : null,
        amounts: [...(supportAmounts ?? [])]
          .sort((a, b) => a.order_index - b.order_index)
          .map((amount) => {
            const urlResult = validateHotmartUrl(amount.hotmart_checkout_url)
            return {
              ...amount,
              hotmart_checkout_url: urlResult.normalizedUrl ?? '',
            }
          }),
      }
    })
    .filter((goal) =>
      goal.amounts.some(
        (amount) =>
          Number.isFinite(Number(amount.amount)) &&
          Number(amount.amount) > 0 &&
          validateHotmartUrl(amount.hotmart_checkout_url).ok
      )
    )
  const hasValidSupportOption = availableGoals.length > 0
  const emptyStateCopy = getSupportEmptyStateCopy(
    creatorName,
    hasWebsite || safeSocialLinks.length > 0
  )

  return (
    <>
      <section
        id="apoyar"
        aria-labelledby="support-title"
        className="border-t border-slate-200/80 pt-5 dark:border-slate-800"
      >
        <div className="mb-3.5">
          <h2 id="support-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Objetivos de apoyo
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Elige cómo quieres impulsar el trabajo de {creatorName}.
          </p>
        </div>

        {goalsError ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300"
          >
            No pudimos cargar las opciones de apoyo. Intenta nuevamente más tarde.
          </div>
        ) : availableGoals.length > 0 ? (
          <PublicSupportGoals goals={availableGoals} profileId={profileId} />
        ) : (
          <EmptyState
            icon={Heart}
            title={emptyStateCopy.title}
            description={emptyStateCopy.description}
            className="mt-2"
          />
        )}

        {!goalsError && hasValidSupportOption && (
          <div className="mt-2.5 flex items-center gap-2 px-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <p>
              Pago gestionado por Hotmart. DonacionesSaaS no almacena datos de pago.
            </p>
          </div>
        )}
      </section>

      {!socialLinksError && safeSocialLinks.length > 0 && (
        <section className="mt-6 px-1" aria-labelledby="social-title">
          <h2 id="social-title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Encuéntrame también en
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
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

  const base = resolveSiteUrl()
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
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8f6] dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link
          href={user ? '/dashboard' : '/'}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-xs text-slate-500 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {user ? 'Ir al panel' : 'Volver al inicio'}
        </Link>
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <div className="relative h-36 w-full overflow-hidden rounded-3xl bg-slate-900 sm:h-44">
          {safeBanner ? (
            <Image
              src={safeBanner}
              alt={`Portada de ${profile.display_name}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 672px) 100vw, 672px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <Heart className="size-20 fill-emerald-500/10 text-emerald-500/20 sm:size-24" />
            </div>
          )}
          {safeBanner && <div className="absolute inset-0 bg-slate-950/20" />}
        </div>

        <div className="relative -mt-9 mb-3 px-3">
          <div className="relative flex size-[4.5rem] items-center justify-center overflow-hidden rounded-full border-4 border-[#f7f8f6] bg-emerald-500 dark:border-slate-950">
            {safeAvatar ? (
              <Image
                src={safeAvatar}
                alt={`Foto de ${profile.display_name}`}
                fill
                className="object-cover"
                sizes="72px"
                priority
              />
            ) : (
              <span className="text-xl font-bold text-white">{initials}</span>
            )}
          </div>
        </div>

        <section className="mb-4 space-y-1.5 px-1" aria-labelledby="creator-name">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="creator-name" className="break-words text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                {profile.display_name}
              </h1>
              <p className="mt-0.5 break-all text-sm text-slate-500 dark:text-slate-400">
                @{profile.username}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <ShareButton url={profileUrl} name={profile.display_name} />
              <ReportButton profileId={profile.id} profileName={profile.display_name} />
            </div>
          </div>

          {profile.bio && (
            <p className="max-w-prose pt-1.5 text-[15px] leading-6 text-slate-600 dark:text-slate-400">
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
          <PublicSupportContent
            profileId={profile.id}
            creatorName={profile.display_name}
            hasWebsite={Boolean(safeWebsite)}
          />
        </Suspense>

        <div className="mt-8 text-center">
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
