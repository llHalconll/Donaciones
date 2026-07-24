import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/theme-toggle'
import { Heart } from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface PageProps {
  params: Promise<{ username: string }>
}

// Only safe public fields — never expose is_admin
interface PublicProfile {
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
}

// ─────────────────────────────────────────────
// Dynamic Metadata
// ─────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url')
    .eq('username', username.toLowerCase())
    .eq('is_active', true)
    .single()

  if (!data) {
    return {
      title: 'Perfil no encontrado',
    }
  }

  const title = `${data.display_name} (@${username}) · DonacionesSaaS`
  const description =
    data.bio?.slice(0, 160) ??
    `Apoya a ${data.display_name} directamente con tu donación en Hotmart.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.avatar_url ? [{ url: data.avatar_url }] : [],
      type: 'profile',
    },
  }
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default async function PublicCreatorPage({ params }: PageProps) {
  const { username } = await params
  const cleanUsername = username.toLowerCase()

  const supabase = await createClient()

  // Select only public fields — never is_admin, is_active beyond filter
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url, banner_url')
    .eq('username', cleanUsername)
    .eq('is_active', true)
    .single<PublicProfile>()

  if (!profile) {
    notFound()
  }

  const initials = profile.display_name.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col items-center">
      {/* Minimal top bar */}
      <header className="w-full max-w-2xl px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500/20" aria-hidden="true" />
          <span>DonacionesSaaS</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-2xl px-4 pb-20 space-y-0">
        {/* Profile card */}
        <article className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          {/* Banner */}
          <div className="relative h-40 sm:h-52 w-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-slate-900">
            {profile.banner_url && (
              <Image
                src={profile.banner_url}
                alt={`Banner de ${profile.display_name}`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            )}
          </div>

          <div className="px-6 pb-8">
            {/* Avatar */}
            <div className="-mt-14 mb-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden bg-emerald-500/10 flex items-center justify-center">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={`Foto de perfil de ${profile.display_name}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Name & handle — rendered as text, not HTML */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {profile.display_name}
            </h1>
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              @{profile.username}
            </p>

            {/* Bio — whitespace-pre-line preserves line breaks, text only */}
            {profile.bio && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            )}

            {/* Placeholder for donation buttons (next phase) */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 italic">
                Los botones de donación estarán disponibles próximamente.
              </p>
            </div>
          </div>
        </article>

        {/* Footer attribution */}
        <p className="text-center pt-8 text-xs text-slate-400">
          Perfil creado en{' '}
          <Link href="/" className="text-emerald-500 hover:underline">
            DonacionesSaaS
          </Link>
          {' '}· Pagos procesados por Hotmart
        </p>
      </main>
    </div>
  )
}
