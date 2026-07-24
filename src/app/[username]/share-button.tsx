'use client'

import { useState } from 'react'
import { Share2, Copy, CheckCircle2 } from 'lucide-react'

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
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30"
      aria-label="Compartir o copiar enlace"
    >
      {copied ? (
        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-emerald-500">Copiado</span></>
      ) : (
        <><Share2 className="w-3.5 h-3.5" /> Compartir</>
      )}
    </button>
  )
}
