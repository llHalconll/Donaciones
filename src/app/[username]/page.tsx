import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicAmountGrid } from './amount-grid'
import { PublicSocialLinks } from './social-links'
import { ReportButton } from './report-button'
import { ShareButton } from './share-button'
import { ArrowLeft, Globe, Heart } from 'lucide-react'

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
      card: 'summary_large_image',
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

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://donacionessaas.com'
  const profileUrl = `${base}/${username}`
  const initials = profile.display_name.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Back to home */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio
        </Link>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-20 pt-2">

        {/* Banner */}
        <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 mb-0">
          {profile.banner_url && (
            <Image
              src={profile.banner_url}
              alt={`Banner de ${profile.display_name}`}
              fill
              className="object-cover"
              priority
              sizes="672px"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
        </div>

        {/* Avatar superpuesto */}
        <div className="relative px-4 -mt-10 mb-4">
          <div className="relative w-20 h-20 rounded-full border-4 border-white dark:border-slate-950 shadow-lg overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
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

        {/* Nombre + botones */}
        <div className="px-1 space-y-1 mb-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{profile.display_name}</h1>
              <p className="text-xs text-slate-400 font-mono">@{profile.username}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <ShareButton url={profileUrl} name={profile.display_name} />
              <ReportButton profileId={profile.id} profileName={profile.display_name} />
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              {profile.bio}
            </p>
          )}

          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Sitio web de ${profile.display_name} (abre en nueva pestaña)`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-500 transition-colors mt-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-mono">{profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </a>
          )}
        </div>

        {/* Redes sociales + Compartir */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <PublicSocialLinks links={socialLinks} />
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-800 mb-6" />

        {/* Sección de apoyo */}
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
          Elige cómo apoyar a {profile.display_name}
        </h2>

        {buttons && buttons.length > 0 ? (
          <PublicAmountGrid buttons={buttons} profileId={profile.id} />
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">Este creador aún no ha configurado sus montos de apoyo.</p>
          </div>
        )}

        {/* Aviso de pagos */}
        <div className="mt-6 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-center space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Al hacer clic en Apoyar, serás redirigido al checkout de Hotmart del creador.
          </p>
          <p className="text-xs text-slate-400">
            DonacionesSaaS no procesa pagos. La transacción se realiza completamente en Hotmart.
          </p>
        </div>

        {/* Footer branding */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-500 transition-colors"
          >
            <Heart className="w-3 h-3" />
            Crea tu propia página en <strong className="ml-0.5">DonacionesSaaS</strong>
          </a>
        </div>
      </main>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': profile.account_type === 'organization' ? 'Organization' : 'Person',
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
