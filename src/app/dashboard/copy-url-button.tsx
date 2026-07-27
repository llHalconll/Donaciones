'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CopyUrlButton({ url }: { url: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const resetTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
  }, [])

  function scheduleReset() {
    if (resetTimer.current) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setStatus('idle'), 2500)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      scheduleReset()
    } catch {
      try {
        const el = document.createElement('textarea')
        el.value = url
        el.setAttribute('readonly', '')
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        const copied = document.execCommand('copy')
        document.body.removeChild(el)
        if (!copied) throw new Error('Copy command failed')
        setStatus('copied')
      } catch {
        setStatus('error')
      }
      scheduleReset()
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label={status === 'copied' ? 'Enlace copiado' : 'Copiar enlace público'}
      >
        {status === 'copied' ? (
          <><Check className="size-4 text-emerald-500" aria-hidden="true" /> Enlace copiado</>
        ) : status === 'error' ? (
          <><AlertCircle className="size-4 text-rose-500" aria-hidden="true" /> No se pudo copiar</>
        ) : (
          <><Copy className="size-4" aria-hidden="true" /> Copiar</>
        )}
      </Button>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {status === 'copied' ? 'Enlace copiado al portapapeles.' : status === 'error' ? 'No se pudo copiar el enlace.' : ''}
      </span>
    </div>
  )
}
