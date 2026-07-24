'use client'

import Image from 'next/image'
import { Globe } from 'lucide-react'

interface ProfilePreviewCardProps {
  displayName: string
  username: string
  bio: string
  avatarUrl: string | null
  bannerUrl: string | null
}

export function ProfilePreviewCard({
  displayName,
  username,
  bio,
  avatarUrl,
  bannerUrl,
}: ProfilePreviewCardProps) {
  const name = displayName.trim() || 'Tu nombre'
  const handle = username.trim() || 'tu_usuario'
  const cleanBio = bio.trim()

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
      {/* Banner */}
      <div className="relative h-24 sm:h-28 w-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-slate-900">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt="Banner de perfil"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        )}
      </div>

      <div className="px-5 pb-5">
        {/* Avatar */}
        <div className="-mt-10 mb-3">
          <div className="relative w-16 h-16 rounded-full border-2 border-white dark:border-slate-900 shadow-md overflow-hidden bg-emerald-500/10 flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`Foto de ${name}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Name & username */}
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
          {name}
        </h3>
        <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
          @{handle}
        </p>

        {/* Bio */}
        {cleanBio && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line line-clamp-3">
            {cleanBio}
          </p>
        )}

        {/* Public URL */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-mono truncate">/{handle}</span>
        </div>
      </div>
    </div>
  )
}
