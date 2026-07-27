import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getHotmartWebhookStatus } from '../src/app/api/webhook/hotmart/route.js'

describe('Hotmart webhook', () => {
  it('is disabled by default', () => {
    assert.equal(getHotmartWebhookStatus(undefined), 'disabled')
  })

  it('remains non-implemented when enablement is requested', () => {
    assert.equal(getHotmartWebhookStatus('true'), 'not-implemented')
    assert.equal(getHotmartWebhookStatus('false'), 'disabled')
  })
})
