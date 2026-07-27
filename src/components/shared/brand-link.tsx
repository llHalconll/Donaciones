import Link from 'next/link'
import { Heart } from 'lucide-react'

export function BrandLink({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const iconSize = size === 'lg' ? 'size-10' : size === 'sm' ? 'size-8' : 'size-9'
  const heartSize = size === 'lg' ? 'size-5' : 'size-4'
  const textSize = size === 'lg' ? 'text-xl' : 'text-lg'

  return (
    <Link
      href="/"
      className={`group inline-flex min-h-11 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${className}`}
      aria-label="DonacionesSaaS, ir al inicio"
    >
      <span className={`${iconSize} flex shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-105`}>
        <Heart className={`${heartSize} fill-emerald-500/20`} aria-hidden="true" />
      </span>
      <span className={`${textSize} font-extrabold tracking-tight text-slate-900 dark:text-white`}>
        Donaciones<span className="text-emerald-500">SaaS</span>
      </span>
    </Link>
  )
}
