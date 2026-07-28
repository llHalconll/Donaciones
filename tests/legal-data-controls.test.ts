import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

const consentSql = read('supabase/migrations/013_legal_acceptance.sql')
const rlsSql = read('supabase/migrations/014_profiles_rls_hardening.sql')
const retentionSql = read('supabase/migrations/015_data_retention.sql')
const functionPrivilegesSql = read(
  'supabase/migrations/016_function_privileges.sql'
)
const cookieConsentSql = read('supabase/migrations/017_cookie_consent.sql')
const registerPage = read('src/app/auth/register/page.tsx')
const settingsForm = read(
  'src/app/dashboard/settings/settings-form.tsx'
)

describe('legal acceptance evidence', () => {
  it('records both versioned documents with a server timestamp', () => {
    assert.match(consentSql, /CREATE TABLE IF NOT EXISTS public\.legal_acceptances/)
    assert.match(consentSql, /document_type/)
    assert.match(consentSql, /document_version/)
    assert.match(consentSql, /accepted_at\s+TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)/)
    assert.match(consentSql, /on_auth_user_legal_acceptance/)
    assert.match(consentSql, /record_current_legal_acceptance/)
  })

  it('only lets authenticated users read their own evidence', () => {
    assert.match(consentSql, /TO authenticated\s+USING \(user_id = auth\.uid\(\)\)/)
    assert.doesNotMatch(
      consentSql,
      /ON public\.legal_acceptances FOR (INSERT|UPDATE|DELETE)/
    )
  })

  it('requires one consent for email and Google registration', () => {
    assert.match(registerPage, /name="legalAccepted"/)
    assert.match(registerPage, /Términos y Condiciones/)
    assert.match(registerPage, /Política de Privacidad/)
    assert.match(registerPage, /requireLegalAcceptance/)
  })
})

describe('cookie consent evidence', () => {
  it('registers the cookie policy version and authenticated choices', () => {
    assert.match(cookieConsentSql, /'terms', 'privacy', 'cookies'/)
    assert.match(
      cookieConsentSql,
      /CREATE TABLE IF NOT EXISTS public\.cookie_consent_records/
    )
    assert.match(cookieConsentSql, /consented_at\s+TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)/)
    assert.match(cookieConsentSql, /record_current_cookie_consent/)
  })

  it('blocks direct public access and exposes only the authenticated RPC', () => {
    assert.match(
      cookieConsentSql,
      /REVOKE ALL ON public\.cookie_consent_records FROM PUBLIC, anon, authenticated/
    )
    assert.match(
      cookieConsentSql,
      /GRANT EXECUTE ON FUNCTION public\.record_current_cookie_consent[\s\S]*TO authenticated/
    )
    assert.doesNotMatch(
      cookieConsentSql,
      /CREATE POLICY[\s\S]*cookie_consent_records/
    )
  })
})

describe('profile privacy and privilege controls', () => {
  it('limits anonymous profile columns', () => {
    const anonGrant = rlsSql.match(
      /GRANT SELECT \(([\s\S]*?)\) ON public\.profiles TO anon;/
    )?.[1]

    assert.ok(anonGrant)
    assert.doesNotMatch(anonGrant, /\bplan\b/)
    assert.doesNotMatch(anonGrant, /\bis_admin\b/)
    assert.doesNotMatch(anonGrant, /\bcreated_at\b/)
    assert.match(anonGrant, /\bdisplay_name\b/)
    assert.match(anonGrant, /\bwebsite_url\b/)
  })

  it('removes direct updates to protected profile state', () => {
    assert.match(
      rlsSql,
      /REVOKE UPDATE ON public\.profiles FROM anon, authenticated/
    )
    assert.match(rlsSql, /deactivate_own_profile/)
    assert.match(rlsSql, /admin_set_profile_active/)
    assert.match(rlsSql, /is_username_available/)
  })

  it('removes anonymous execution from privileged functions', () => {
    assert.match(
      functionPrivilegesSql,
      /deactivate_own_profile\(\)\s+FROM PUBLIC, anon, authenticated/
    )
    assert.match(
      functionPrivilegesSql,
      /admin_set_profile_active\(UUID, BOOLEAN\)\s+FROM PUBLIC, anon, authenticated/
    )
    assert.match(
      functionPrivilegesSql,
      /record_current_legal_acceptance\(TEXT, TEXT, TEXT\)\s+FROM PUBLIC, anon, authenticated/
    )
  })

  it('describes the UI action as profile deactivation', () => {
    assert.match(settingsForm, /Desactivar perfil público/)
    assert.match(settingsForm, /no elimina tu cuenta ni tus datos/)
    assert.doesNotMatch(settingsForm, />\s*Eliminar Cuenta\s*</)
  })
})

describe('operational retention', () => {
  it('defines and restricts the purge function', () => {
    assert.match(retentionSql, /purge_expired_operational_data/)
    assert.match(retentionSql, /INTERVAL '13 months'/)
    assert.match(retentionSql, /INTERVAL '24 months'/)
    assert.match(retentionSql, /INTERVAL '90 days'/)
    assert.match(
      retentionSql,
      /GRANT EXECUTE ON FUNCTION public\.purge_expired_operational_data\(\)\s+TO service_role/
    )
  })
})
