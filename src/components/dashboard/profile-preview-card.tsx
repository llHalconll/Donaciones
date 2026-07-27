'use client'

import Image from 'next/image'
import { Globe, Building2, UserCircle2 } from 'lucide-react'
import type { AccountType } from '@/types/database.types'

interface ProfilePreviewCardProps {
  displayName: string
  username: string
  bio: string
  accountType: AccountType
  websiteUrl?: string
  avatarUrl: string | null
  bannerUrl: string | null
}

export function ProfilePreviewCard({
  displayName, username, bio, accountType, websiteUrl, avatarUrl, bannerUrl,
}: ProfilePreviewCardProps) {
  const name = displayName.trim() || 'Tu nombre'
  const handle = username.trim() || 'tu_usuario'

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Banner */}
      <div className="relative h-24 sm:h-28 w-full bg-slate-900">
        {bannerUrl && (
          <Image src={bannerUrl} alt="Banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="-mt-9 mb-2">
          <div className="relative w-14 h-14 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-emerald-500 flex items-center justify-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={`Foto de ${name}`} fill className="object-cover" sizes="56px" />
            ) : (
              <span className="text-lg font-bold text-white dark:text-slate-950">
                {name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Badge de tipo */}
        <div className="flex items-center gap-1.5 mb-1">
          {accountType === 'organization' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-2.5 h-2.5" /> Organización
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <UserCircle2 className="w-2.5 h-2.5" /> Creador
            </span>
          )}
        </div>

        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{name}</h3>
        <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">@{handle}</p>

        {bio.trim() && (
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 whitespace-pre-line">{bio}</p>
        )}

        {/* Website */}
        {websiteUrl?.trim() && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Globe className="w-3 h-3" />
            <span className="truncate font-mono">{websiteUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <Globe className="w-3 h-3 flex-shrink-0" />
          <span className="font-mono truncate">/{handle}</span>
        </div>
      </div>
    </div>
  )
}
