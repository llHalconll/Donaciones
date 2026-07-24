import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyticsLimiter, checkRateLimit } from '@/lib/rate-limit'
import type { EventType } from '@/types/database.types'

const VALID_EVENTS: Set<EventType> = new Set(['profile_view', 'amount_selected', 'hotmart_redirect'])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, donation_button_id, event_type, session_id, referrer } = body

    // Validate event_type strictly — never trust client
    if (!VALID_EVENTS.has(event_type as EventType))
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })

    if (!profile_id || typeof profile_id !== 'string')
      return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })

    // ─── Persistent rate limiting (Upstash Redis) ───
    // Key: session_id if available, else IP. Both scoped to profile_id.
    const rateLimitKey = session_id
      ? `session:${String(session_id).slice(0, 64)}:${profile_id}`
      : `ip:${req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'}:${profile_id}`

    const rateResult = await checkRateLimit(analyticsLimiter, rateLimitKey)
    if (!rateResult.allowed) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (rateResult.retryAfter) headers['Retry-After'] = String(rateResult.retryAfter)
      return new NextResponse(
        JSON.stringify({ ok: true }), // Silent 200 — don't alert scrapers
        { status: 200, headers }
      )
    }

    const supabase = await createClient()

    // Verify profile exists and is active
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .eq('is_active', true)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Truncate referrer to avoid storing long sensitive URLs
    const safeReferrer = typeof referrer === 'string' ? referrer.slice(0, 200) : null
    const safeSession = typeof session_id === 'string' ? session_id.slice(0, 64) : null

    await supabase.from('analytics_events').insert({
      profile_id,
      donation_button_id: typeof donation_button_id === 'string' ? donation_button_id : null,
      event_type,
      session_id: safeSession,
      referrer: safeReferrer,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
