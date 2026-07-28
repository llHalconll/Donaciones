import { NextResponse } from 'next/server'
import {
  COOKIE_CONSENT_DURATION_DAYS,
  COOKIE_POLICY_VERSION,
  type CookieConsentMethod,
} from '@/lib/cookie-consent'
import { createClient } from '@/lib/supabase/server'

const VALID_METHODS: ReadonlySet<CookieConsentMethod> = new Set([
  'banner_accept_all',
  'banner_reject_nonessential',
  'preferences_save',
  'footer_preferences',
])

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { version, categories, method } = body as Record<string, unknown>
    if (
      version !== COOKIE_POLICY_VERSION ||
      !VALID_METHODS.has(method as CookieConsentMethod) ||
      !categories ||
      typeof categories !== 'object' ||
      Array.isArray(categories)
    ) {
      return NextResponse.json(
        { error: 'Invalid cookie preferences' },
        { status: 400 }
      )
    }

    const values = categories as Record<string, unknown>
    if (
      values.necessary !== true ||
      typeof values.preferences !== 'boolean' ||
      typeof values.analytics !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid cookie categories' },
        { status: 400 }
      )
    }

    const recordedAt = new Date()
    const expiresAt = new Date(recordedAt)
    expiresAt.setUTCDate(
      expiresAt.getUTCDate() + COOKIE_CONSENT_DURATION_DAYS
    )

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let persisted = false
    if (user) {
      const { error } = await supabase.rpc('record_current_cookie_consent', {
        p_cookie_policy_version: COOKIE_POLICY_VERSION,
        p_preferences: values.preferences,
        p_analytics: values.analytics,
        p_consent_method: method,
      })

      if (error) {
        return NextResponse.json(
          { error: 'Unable to record authenticated consent' },
          { status: 500 }
        )
      }
      persisted = true
    }

    return NextResponse.json(
      {
        ok: true,
        recordedAt: recordedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        persisted,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
