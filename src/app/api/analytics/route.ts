import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyticsLimiter, checkRateLimit } from '@/lib/rate-limit'
import type { EventType } from '@/types/database.types'

const VALID_EVENTS: Set<EventType> = new Set(['profile_view', 'amount_selected', 'hotmart_redirect'])
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { profile_id, donation_button_id, event_type, session_id, referrer } =
      body as Record<string, unknown>

    // Validate event_type strictly — never trust client
    if (!VALID_EVENTS.has(event_type as EventType))
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })

    if (typeof profile_id !== 'string' || !UUID_PATTERN.test(profile_id))
      return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })

    const safeSession = typeof session_id === 'string' ? session_id.slice(0, 64) : null

    // ─── Persistent rate limiting (Upstash Redis) ───
    // Key: session_id if available, else IP. Both scoped to profile_id.
    const rateLimitKey = safeSession
      ? `session:${safeSession}:${profile_id}`
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

    let safeButtonId: string | null = null
    if (event_type !== 'profile_view') {
      if (typeof donation_button_id !== 'string' || !UUID_PATTERN.test(donation_button_id))
        return NextResponse.json({ error: 'Missing donation_button_id' }, { status: 400 })

      const { data: donationButton } = await supabase
        .from('donation_buttons')
        .select('id')
        .eq('id', donation_button_id)
        .eq('profile_id', profile_id)
        .eq('is_active', true)
        .single()

      if (!donationButton)
        return NextResponse.json({ error: 'Donation button not found' }, { status: 404 })

      safeButtonId = donationButton.id
    }

    // Truncate referrer to avoid storing long sensitive URLs
    const safeReferrer = typeof referrer === 'string' ? referrer.slice(0, 200) : null

    const { error: insertError } = await supabase.from('analytics_events').insert({
      profile_id,
      donation_button_id: safeButtonId,
      event_type,
      session_id: safeSession,
      referrer: safeReferrer,
    })

    if (insertError) {
      return NextResponse.json({ error: 'Unable to record event' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
