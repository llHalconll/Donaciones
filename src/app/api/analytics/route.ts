import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EventType } from '@/types/database.types'

const VALID_EVENTS: Set<EventType> = new Set(['profile_view', 'amount_selected', 'hotmart_redirect'])

// Simple in-memory rate limiting per session (resets per serverless instance)
// For production, use Redis or Supabase edge function with proper rate limiting
const rateMap = new Map<string, number>()
const RATE_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT = 30 // max events per session per window

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profile_id, donation_button_id, event_type, session_id, referrer } = body

    // Validate event_type strictly — never trust client
    if (!VALID_EVENTS.has(event_type as EventType))
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })

    if (!profile_id || typeof profile_id !== 'string')
      return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 })

    // Rate limiting by session_id
    if (session_id) {
      const key = `${session_id}:${profile_id}`
      const last = rateMap.get(key) ?? 0
      const now = Date.now()
      if (now - last < RATE_WINDOW_MS / RATE_LIMIT) {
        // Too fast — silently ignore to avoid blocking visitor experience
        return NextResponse.json({ ok: true })
      }
      rateMap.set(key, now)
      // Cleanup old entries periodically
      if (rateMap.size > 10000) rateMap.clear()
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
