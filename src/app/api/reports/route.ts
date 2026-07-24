import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_REASONS = new Set(['fraud', 'impersonation', 'prohibited_content', 'suspicious_link', 'spam', 'other'])

// Simple in-memory rate limit: max 5 reports per session per hour
const reportRateMap = new Map<string, { count: number; windowStart: number }>()
const RATE_WINDOW = 3_600_000 // 1 hour
const RATE_MAX = 5

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

    // Rate limiting by IP (hashed, not stored)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const rateKey = ip + ':report'
    const now = Date.now()
    const rateEntry = reportRateMap.get(rateKey)

    if (rateEntry) {
      if (now - rateEntry.windowStart < RATE_WINDOW) {
        if (rateEntry.count >= RATE_MAX)
          return NextResponse.json({ error: 'Demasiados reportes. Intenta más tarde.' }, { status: 429 })
        rateEntry.count++
      } else {
        reportRateMap.set(rateKey, { count: 1, windowStart: now })
      }
    } else {
      reportRateMap.set(rateKey, { count: 1, windowStart: now })
    }

    if (reportRateMap.size > 5000) reportRateMap.clear()

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
