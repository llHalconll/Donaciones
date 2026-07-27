'use client'

import { useState } from 'react'
import { Share2, CheckCircle2 } from 'lucide-react'

interface Props {
  url: string
  name: string
}

export function ShareButton({ url, name }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    // Try native Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Apoya a ${name}`,
          text: `Apoya a ${name} en DonacionesSaaS`,
          url,
        })
        return
      } catch {
        // User cancelled or API not available — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Final fallback for very old browsers
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex size-11 items-center justify-center gap-1.5 rounded-full text-xs text-slate-400 transition-colors duration-150 hover:bg-emerald-500/10 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-500 dark:hover:text-emerald-400 sm:w-auto sm:px-3"
      aria-label="Compartir o copiar enlace"
    >
      {copied ? (
        <><CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" /> <span className="hidden text-emerald-500 sm:inline">Copiado</span></>
      ) : (
        <><Share2 className="size-4" aria-hidden="true" /> <span className="hidden sm:inline">Compartir</span></>
      )}
    </button>
  )
}
