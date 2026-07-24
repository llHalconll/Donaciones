// Social links usando solo iconos genéricos de Lucide React
// que existen en la versión 1.x (sin iconos de marcas)
import {
  Globe, MessageCircle, ExternalLink, Send, Video,
  Camera, Users, Briefcase, Gamepad2, Tv, Link,
} from 'lucide-react'
import type { SocialLink } from '@/types/database.types'

// SVG personalizado para X (Twitter)
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// SVG personalizado para TikTok
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.12z" />
    </svg>
  )
}

// Mapeo: plataforma → componente de ícono genérico disponible en lucide-react v1.x
const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Camera,
  youtube: Video,
  tiktok: TikTokIcon,
  facebook: Users,
  x: XIcon,
  twitch: Gamepad2,
  linkedin: Briefcase,
  discord: MessageCircle,
  telegram: Send,
  whatsapp: MessageCircle,
  website: Globe,
  other: ExternalLink,
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  x: 'X',
  twitch: 'Twitch',
  linkedin: 'LinkedIn',
  discord: 'Discord',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  website: 'Sitio web',
  other: 'Enlace',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'hover:text-pink-500',
  youtube: 'hover:text-red-500',
  tiktok: 'hover:text-slate-900 dark:hover:text-white',
  facebook: 'hover:text-blue-600',
  x: 'hover:text-slate-900 dark:hover:text-white',
  twitch: 'hover:text-purple-500',
  linkedin: 'hover:text-blue-700',
  discord: 'hover:text-indigo-500',
  telegram: 'hover:text-sky-500',
  whatsapp: 'hover:text-green-500',
  website: 'hover:text-emerald-500',
  other: 'hover:text-slate-600 dark:hover:text-slate-200',
}

interface Props {
  links: Pick<SocialLink, 'id' | 'platform' | 'label' | 'url'>[]
}

export function PublicSocialLinks({ links }: Props) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Redes sociales">
      {links.map((link) => {
        const Icon = PLATFORM_ICONS[link.platform] ?? ExternalLink
        const colorClass = PLATFORM_COLORS[link.platform] ?? PLATFORM_COLORS.other
        const label = link.label ?? PLATFORM_LABELS[link.platform] ?? link.platform

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${label} (abre en nueva pestaña)`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 transition-colors ${colorClass}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </a>
        )
      })}
    </div>
  )
}
