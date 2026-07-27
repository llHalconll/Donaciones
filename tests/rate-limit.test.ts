import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAuthRateLimitKey,
  checkRateLimit,
  getTrustedClientIp,
  getUnavailableRateLimitResult,
} from '../src/lib/rate-limit.js'

describe('rate limiting', () => {
  it('fails closed when Redis is absent in production', () => {
    assert.deepEqual(getUnavailableRateLimitResult('production'), {
      allowed: false,
      reason: 'unavailable',
      retryAfter: 60,
    })
  })

  it('uses a controlled fail-open fallback outside production', () => {
    assert.equal(getUnavailableRateLimitResult('development').allowed, true)
  })

  it('returns 429-compatible state and Retry-After when the limit is exceeded', async () => {
    const result = await checkRateLimit({
      async limit() {
        return { success: false, reset: Date.now() + 5_000 }
      },
    }, 'safe-key', 'production')

    assert.equal(result.allowed, false)
    assert.equal(result.reason, 'limited')
    assert.ok((result.retryAfter ?? 0) >= 1)
  })

  it('allows a successful configured limiter', async () => {
    const result = await checkRateLimit({
      async limit() {
        return { success: true, reset: Date.now() + 5_000 }
      },
    }, 'safe-key', 'production')

    assert.deepEqual(result, { allowed: true })
  })

  it('normalizes email without exposing it in the auth key', () => {
    const first = buildAuthRateLimitKey('login', ' User@Example.com ', '203.0.113.10')
    const second = buildAuthRateLimitKey('login', 'user@example.com', '203.0.113.10')

    assert.equal(first, second)
    assert.equal(first.includes('user@example.com'), false)
  })

  it('trusts forwarding headers only on an identified Vercel proxy', () => {
    const forwardedHeaders = new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' })

    assert.equal(getTrustedClientIp(forwardedHeaders, {}), 'unknown')
    assert.equal(
      getTrustedClientIp(forwardedHeaders, { VERCEL: '1' }),
      '203.0.113.10'
    )
  })
})
