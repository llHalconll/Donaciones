import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getDemoUsername,
  getSupportEmail,
  normalizeDemoUsername,
} from '../src/lib/public-config.js'

describe('public configuration', () => {
  it('returns no demo when the variable is absent or invalid', () => {
    assert.equal(getDemoUsername({}), null)
    assert.equal(getDemoUsername({ NEXT_PUBLIC_DEMO_USERNAME: 'invalid username' }), null)
  })

  it('normalizes a configured platform demo username', () => {
    assert.equal(
      getDemoUsername({ NEXT_PUBLIC_DEMO_USERNAME: ' Platform_Demo ' }),
      'platform_demo'
    )
    assert.equal(normalizeDemoUsername('demo'), 'demo')
  })

  it('validates and normalizes the public support email', () => {
    assert.equal(
      getSupportEmail({ NEXT_PUBLIC_SUPPORT_EMAIL: ' Support@Example.com ' }),
      'support@example.com'
    )
    assert.equal(getSupportEmail({ NEXT_PUBLIC_SUPPORT_EMAIL: 'not-an-email' }), null)
  })
})
