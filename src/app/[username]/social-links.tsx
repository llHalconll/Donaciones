import { ExternalLink, Globe } from 'lucide-react'
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import type { SocialLink } from '@/types/database.types'

type PlatformConfig = {
  icon: IconType | React.ComponentType<{ className?: string }>
  label: string
  color: string
  hover: string
}

const PLATFORMS: Record<string, PlatformConfig> = {
  instagram: {
    icon: FaInstagram,
    label: 'Instagram',
    color: 'text-[#E4405F]',
    hover: 'hover:text-pink-600 hover:bg-pink-500/10 hover:border-pink-500/30',
  },
  youtube: {
    icon: FaYoutube,
    label: 'YouTube',
    color: 'text-[#FF0000]',
    hover: 'hover:text-red-600 hover:bg-red-500/10 hover:border-red-500/30',
  },
  tiktok: {
    icon: FaTiktok,
    label: 'TikTok',
    color: 'text-slate-800 dark:text-slate-100',
    hover: 'hover:bg-slate-800/10 hover:border-slate-800/30',
  },
  facebook: {
    icon: FaFacebook,
    label: 'Facebook',
    color: 'text-[#1877F2]',
    hover: 'hover:text-blue-700 hover:bg-blue-500/10 hover:border-blue-500/30',
  },
  x: {
    icon: FaXTwitter,
    label: 'X',
    color: 'text-slate-800 dark:text-slate-100',
    hover: 'hover:bg-slate-800/10 hover:border-slate-400/30',
  },
  twitch: {
    icon: FaTwitch,
    label: 'Twitch',
    color: 'text-[#9146FF]',
    hover: 'hover:text-purple-600 hover:bg-purple-500/10 hover:border-purple-500/30',
  },
  linkedin: {
    icon: FaLinkedin,
    label: 'LinkedIn',
    color: 'text-[#0A66C2]',
    hover: 'hover:text-blue-800 hover:bg-blue-500/10 hover:border-blue-500/30',
  },
  discord: {
    icon: FaDiscord,
    label: 'Discord',
    color: 'text-[#5865F2]',
    hover: 'hover:text-indigo-600 hover:bg-indigo-500/10 hover:border-indigo-500/30',
  },
  telegram: {
    icon: FaTelegram,
    label: 'Telegram',
    color: 'text-[#26A5E4]',
    hover: 'hover:text-sky-600 hover:bg-sky-500/10 hover:border-sky-500/30',
  },
  whatsapp: {
    icon: FaWhatsapp,
    label: 'WhatsApp',
    color: 'text-[#25D366]',
    hover: 'hover:text-green-600 hover:bg-green-500/10 hover:border-green-500/30',
  },
  website: {
    icon: Globe,
    label: 'Sitio web',
    color: 'text-emerald-500',
    hover: 'hover:text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/30',
  },
  other: {
    icon: ExternalLink,
    label: 'Enlace',
    color: 'text-slate-500',
    hover: 'hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-500/10',
  },
}

const FALLBACK: PlatformConfig = PLATFORMS.other

interface Props {
  links: Pick<SocialLink, 'id' | 'platform' | 'label' | 'url'>[]
}

export function PublicSocialLinks({ links }: Props) {
  return (
    <>
      {links.map((link) => {
        const config = PLATFORMS[link.platform] ?? FALLBACK
        const Icon = config.icon
        const displayLabel = link.label ?? config.label

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${displayLabel} (abre en una pestaña nueva)`}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-transparent bg-slate-100/80 px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-slate-900 ${config.color} ${config.hover}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{displayLabel}</span>
          </a>
        )
      })}
    </>
  )
}
