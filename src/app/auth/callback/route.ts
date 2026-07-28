import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getPendingLegalConsentValue,
  PENDING_LEGAL_CONSENT_COOKIE,
  PRIVACY_VERSION,
  TERMS_VERSION,
} from '@/lib/legal-consent'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const cookieStore = await cookies()
      const pendingConsent = cookieStore.get(
        PENDING_LEGAL_CONSENT_COOKIE
      )?.value

      if (pendingConsent === getPendingLegalConsentValue()) {
        const { error: consentError } = await supabase.rpc(
          'record_current_legal_acceptance',
          {
            p_terms_version: TERMS_VERSION,
            p_privacy_version: PRIVACY_VERSION,
            p_acceptance_method: 'google_oauth',
          }
        )

        cookieStore.set(PENDING_LEGAL_CONSENT_COOKIE, '', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 0,
          path: '/auth/callback',
        })

        if (consentError) {
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/auth/login?error=ConsentRecordingFailed`
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=InvalidAuthCode`)
}
