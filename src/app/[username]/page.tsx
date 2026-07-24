import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PublicAmountGrid } from './amount-grid'
import { PublicSocialLinks } from './social-links'
import { ReportButton } from './report-button'
import { Building2, UserCircle2, Globe, Share2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, account_type')
    .eq('username', username.toLowerCase())
    .eq('is_active', true)
    .single()

  if (!profile) return { title: 'Perfil no encontrado' }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://donacionessaas.com'
  const desc = profile.bio ?? `Apoya a ${profile.display_name} directamente a través de sus enlaces de Hotmart.`

  return {
    title: `${profile.display_name} (@${username}) | DonacionesSaaS`,
    description: desc,
    openGraph: {
      title: `${profile.display_name} | DonacionesSaaS`,
      description: desc,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
      url: `${base}/${username}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${profile.display_name} (@${username})`,
      description: desc,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
    alternates: { canonical: `${base}/${username}` },
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, username, bio, avatar_url, banner_url, account_type, website_url, is_active')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile || !profile.is_active) notFound()

  const [{ data: socialLinks }, { data: buttons }] = await Promise.all([
    supabase
      .from('social_links')
      .select('id, platform, label, url, is_active, order_index')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .order('order_index'),
    supabase
      .from('donation_buttons')
      .select('id, title, description, amount, currency, hotmart_checkout_url, button_label, is_active, is_featured, order_index')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .order('order_index'),
  ])

  const isOrg = profile.account_type === 'organization'
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://donacionessaas.com'
  const profileUrl = `${base}/${username}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Banner */}
      <div className="relative w-full h-40 sm:h-52 bg-gradient-to-r from-emerald-600 via-indigo-700 to-slate-900 overflow-hidden">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt={`Banner de ${profile.display_name}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4">
        {/* Avatar */}
        <div className="-mt-14 sm:-mt-16 mb-4 flex items-end justify-between">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-slate-950 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 flex items-center justify-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`Foto de ${profile.display_name}`}
                fill
                className="object-cover"
                sizes="112px"
                priority
              />
            ) : (
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Share + Report */}
          <div className="flex gap-2 pb-2">
            <ReportButton profileId={profile.id} profileName={profile.display_name} />
          </div>
        </div>

        {/* Identity */}
        <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {profile.display_name}
                </h1>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isOrg
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                  {isOrg ? <><Building2 className="w-3 h-3" /> Organización</> : <><UserCircle2 className="w-3 h-3" /> Creador</>}
                </span>
              </div>
              <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">@{profile.username}</p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* Website + socials */}
          <div className="flex flex-wrap items-center gap-3">
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="font-mono">{profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              </a>
            )}
          </div>

          {socialLinks && socialLinks.length > 0 && (
            <PublicSocialLinks links={socialLinks} />
          )}
        </div>

        {/* Donation buttons */}
        <div className="py-8 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Elige cómo apoyar a {profile.display_name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona un monto. Serás redirigido al checkout de Hotmart del creador.
            </p>
          </div>

          {buttons && buttons.length > 0 ? (
            <PublicAmountGrid
              buttons={buttons}
              profileId={profile.id}
            />
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Este creador aún no ha configurado sus montos de apoyo.</p>
            </div>
          )}

          {/* Trust notice */}
          <div className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Al hacer clic en Apoyar, serás redirigido al checkout de Hotmart del creador.
            </p>
            <p className="text-xs text-slate-400">
              DonacionesSaaS no procesa pagos. La transacción se realiza completamente en Hotmart.
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <div className="pb-8 text-center">
          <a href="/" className="text-xs text-slate-400 hover:text-emerald-500 transition-colors">
            Crea tu propia página en <strong>DonacionesSaaS</strong>
          </a>
        </div>
      </div>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': isOrg ? 'Organization' : 'Person',
            name: profile.display_name,
            url: profileUrl,
            image: profile.avatar_url ?? undefined,
            description: profile.bio ?? undefined,
          }),
        }}
      />
    </div>
  )
}
