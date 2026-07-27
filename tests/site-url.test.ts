import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeSiteUrl,
  resolveSiteUrl,
  SiteUrlConfigurationError,
} from '../src/lib/site-url.js'

describe('site URL resolver', () => {
  it('normalizes the configured public URL and removes the trailing slash', () => {
    assert.equal(normalizeSiteUrl(' https://example.com/ '), 'https://example.com')
  })

  it('adds HTTPS to deployment hostnames without a protocol', () => {
    assert.equal(normalizeSiteUrl('app.example.com'), 'https://app.example.com')
  })

  it('rejects unsupported schemes, credentials and non-root paths', () => {
    assert.equal(normalizeSiteUrl('ftp://example.com'), null)
    assert.equal(normalizeSiteUrl('https://user:pass@example.com'), null)
    assert.equal(normalizeSiteUrl('https://example.com/path'), null)
  })

  it('uses the documented resolution order', () => {
    assert.equal(resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: 'https://canonical.example',
      VERCEL_PROJECT_PRODUCTION_URL: 'production.example',
      VERCEL_URL: 'preview.example',
      NODE_ENV: 'production',
    }), 'https://canonical.example')

    assert.equal(resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: 'invalid/path',
      VERCEL_PROJECT_PRODUCTION_URL: 'production.example',
      VERCEL_URL: 'preview.example',
      NODE_ENV: 'production',
    }), 'https://production.example')
  })

  it('uses localhost only outside the production runtime', () => {
    assert.equal(resolveSiteUrl({ NODE_ENV: 'development' }), 'http://localhost:3000')
  })

  it('fails explicitly when production has no valid non-local URL', () => {
    assert.throws(
      () => resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        NODE_ENV: 'production',
      }),
      SiteUrlConfigurationError
    )
  })
})
