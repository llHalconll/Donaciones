import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  COOKIE_POLICY_VERSION,
  parseCookieConsent,
} from '../src/lib/cookie-consent'

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('cookie consent parsing', () => {
  it('accepts a current, non-expired record', () => {
    const consent = parseCookieConsent(
      JSON.stringify({
        version: COOKIE_POLICY_VERSION,
        categories: {
          necessary: true,
          preferences: false,
          analytics: true,
        },
        method: 'preferences_save',
        recordedAt: '2026-07-28T12:00:00.000Z',
        expiresAt: '2099-07-28T12:00:00.000Z',
      })
    )

    assert.equal(consent?.categories.necessary, true)
    assert.equal(consent?.categories.preferences, false)
    assert.equal(consent?.categories.analytics, true)
  })

  it('rejects malformed, expired and old-version records', () => {
    assert.equal(parseCookieConsent('not-json'), null)
    assert.equal(
      parseCookieConsent(
        JSON.stringify({
          version: 'old',
          categories: {
            necessary: true,
            preferences: true,
            analytics: true,
          },
          method: 'banner_accept_all',
          recordedAt: '2020-01-01T00:00:00.000Z',
          expiresAt: '2099-01-01T00:00:00.000Z',
        })
      ),
      null
    )
    assert.equal(
      parseCookieConsent(
        JSON.stringify({
          version: COOKIE_POLICY_VERSION,
          categories: {
            necessary: true,
            preferences: true,
            analytics: true,
          },
          method: 'banner_accept_all',
          recordedAt: '2020-01-01T00:00:00.000Z',
          expiresAt: '2020-12-31T00:00:00.000Z',
        })
      ),
      null
    )
  })
})

describe('cookie consent integration', () => {
  const provider = read(
    'src/components/cookies/cookie-consent-provider.tsx'
  )
  const analyticsClient = read('src/lib/analytics/public-client.ts')
  const supportGoals = read('src/app/[username]/support-goals.tsx')
  const footer = read('src/components/shared/footer.tsx')

  it('offers equally direct accept, reject and configure actions', () => {
    assert.match(provider, /Aceptar todas/)
    assert.match(provider, /Rechazar no esenciales/)
    assert.match(provider, /Configurar preferencias/)
    assert.match(provider, /type="checkbox"/)
    assert.doesNotMatch(provider, /marketing:\s*boolean/)
  })

  it('blocks optional analytics and Hotmart until consent', () => {
    assert.match(analyticsClient, /hasCookieCategoryConsent\('analytics'\)/)
    assert.match(supportGoals, /hasValidCheckouts && analyticsAllowed/)
    assert.match(supportGoals, /target=\{analyticsAllowed \? undefined : '_blank'\}/)
  })

  it('keeps a permanent cookie settings control in the footer', () => {
    assert.match(footer, /CookieSettingsButton/)
    assert.match(footer, /href: '\/cookies'/)
  })
})
