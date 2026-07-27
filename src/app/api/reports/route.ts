import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildRateLimitKey,
  checkRateLimit,
  getTrustedClientIp,
  reportLimiter,
} from '@/lib/rate-limit'

const VALID_REASONS = new Set(['fraud', 'impersonation', 'prohibited_content', 'suspicious_link', 'spam', 'other'])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, reason, description, reporter_email } = body

    // Validate inputs server-side
    if (!profile_id || typeof profile_id !== 'string')
      return NextResponse.json({ error: 'profile_id requerido.' }, { status: 400 })

    if (!VALID_REASONS.has(reason))
      return NextResponse.json({ error: 'Motivo no válido.' }, { status: 400 })

    if (description && typeof description === 'string' && description.length > 1000)
      return NextResponse.json({ error: 'La descripción no puede superar 1000 caracteres.' }, { status: 400 })

    if (reporter_email && typeof reporter_email === 'string' && reporter_email.length > 254)
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })

    const trustedIp = getTrustedClientIp(req.headers)
    const rateResult = await checkRateLimit(
      reportLimiter,
      buildRateLimitKey('reports', [trustedIp])
    )

    if (!rateResult.allowed) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (rateResult.retryAfter) headers['Retry-After'] = String(rateResult.retryAfter)

      const unavailable = rateResult.reason === 'unavailable'
      return new NextResponse(
        JSON.stringify({
          error: unavailable
            ? 'Servicio temporalmente no disponible.'
            : 'Demasiados reportes. Intenta más tarde.',
        }),
        { status: unavailable ? 503 : 429, headers }
      )
    }

    const supabase = await createClient()

    // Verify the profile exists and is active
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .eq('is_active', true)
      .single()

    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 })

    const { error } = await supabase.from('profile_reports').insert({
      profile_id,
      reason,
      description: typeof description === 'string' ? description.trim().slice(0, 1000) : null,
      reporter_email: typeof reporter_email === 'string' ? reporter_email.trim().slice(0, 254) || null : null,
      status: 'pending',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
