// Tests using Node.js built-in test runner (Node 18+)
// Run with: npm test
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateUsernameFormat,
  RESERVED_USERNAMES,
} from '../src/lib/validations/auth.js'
import {
  validatePublicImageUrl,
  validatePublicUrl,
  validateHotmartUrl,
} from '../src/lib/validations/url.js'

// ─────────────────────────────────────────────
// Username validation
// ─────────────────────────────────────────────

describe('validateUsernameFormat', () => {
  it('accepts valid usernames', () => {
    assert.equal(validateUsernameFormat('alex').ok, true)
    assert.equal(validateUsernameFormat('alex_123').ok, true)
    assert.equal(validateUsernameFormat('my-name').ok, true)
    assert.equal(validateUsernameFormat('abc').ok, true)
    assert.equal(validateUsernameFormat('a'.repeat(30)).ok, true)
  })

  it('rejects empty username', () => {
    const r = validateUsernameFormat('')
    assert.equal(r.ok, false)
    assert.ok(r.error)
  })

  it('rejects usernames with spaces', () => {
    assert.equal(validateUsernameFormat('my name').ok, false)
  })

  it('rejects usernames too short (< 3)', () => {
    assert.equal(validateUsernameFormat('ab').ok, false)
  })

  it('rejects usernames too long (> 30)', () => {
    assert.equal(validateUsernameFormat('a'.repeat(31)).ok, false)
  })

  it('rejects uppercase letters', () => {
    assert.equal(validateUsernameFormat('AlexCreator').ok, false)
  })

  it('rejects special characters', () => {
    assert.equal(validateUsernameFormat('alex@creator').ok, false)
    assert.equal(validateUsernameFormat('alex.creator').ok, false)
  })

  it('rejects all reserved usernames', () => {
    for (const reserved of RESERVED_USERNAMES) {
      const r = validateUsernameFormat(reserved)
      assert.equal(r.ok, false, `Expected "${reserved}" to be rejected`)
    }
  })
})

// ─────────────────────────────────────────────
// Public URL validation
// ─────────────────────────────────────────────

describe('validatePublicUrl', () => {
  it('accepts valid https URLs', () => {
    assert.equal(validatePublicUrl('https://instagram.com/alex').ok, true)
  })

  it('accepts http URLs', () => {
    assert.equal(validatePublicUrl('http://mysite.com').ok, true)
  })

  it('rejects empty string', () => {
    assert.equal(validatePublicUrl('').ok, false)
  })

  it('rejects javascript: scheme', () => {
    assert.equal(validatePublicUrl('javascript:alert(1)').ok, false)
  })

  it('rejects data: scheme', () => {
    assert.equal(validatePublicUrl('data:text/html,<h1>xss</h1>').ok, false)
  })

  it('rejects file: scheme', () => {
    assert.equal(validatePublicUrl('file:///etc/passwd').ok, false)
  })

  it('rejects URLs with embedded credentials', () => {
    assert.equal(validatePublicUrl('https://user:pass@evil.com').ok, false)
  })

  it('rejects non-URL strings', () => {
    assert.equal(validatePublicUrl('not-a-url').ok, false)
  })
})

// ─────────────────────────────────────────────
// Hotmart URL validation — critical security tests
// ─────────────────────────────────────────────

describe('validateHotmartUrl', () => {
  it('accepts pay.hotmart.com', () => {
    assert.equal(validateHotmartUrl('https://pay.hotmart.com/ABC123?off=xyz').ok, true)
  })

  it('accepts official checkout and promotional-link hosts', () => {
    assert.equal(validateHotmartUrl('https://checkout.hotmart.com/ABC123').ok, true)
    assert.equal(validateHotmartUrl('https://payment.hotmart.com/ABC123').ok, true)
    assert.equal(validateHotmartUrl('https://www.go.hotmart.com/ABC123').ok, true)
  })

  it('rejects Hotmart pages that are not payment or promotional links', () => {
    assert.equal(validateHotmartUrl('https://hotmart.com/product/abc').ok, false)
    assert.equal(validateHotmartUrl('https://app.hotmart.com/products').ok, false)
  })

  it('rejects http (must be HTTPS)', () => {
    assert.equal(validateHotmartUrl('http://pay.hotmart.com/abc').ok, false)
  })

  it('CRITICAL: rejects hotmart.com.evil.com spoofing', () => {
    assert.equal(validateHotmartUrl('https://hotmart.com.evil.com/abc').ok, false)
  })

  it('rejects unrelated domains', () => {
    assert.equal(validateHotmartUrl('https://paypal.com/checkout').ok, false)
    assert.equal(validateHotmartUrl('https://stripe.com/pay').ok, false)
  })

  it('rejects javascript: in Hotmart context', () => {
    assert.equal(validateHotmartUrl('javascript:evil()').ok, false)
  })

  it('rejects embedded credentials', () => {
    assert.equal(validateHotmartUrl('https://user:pass@pay.hotmart.com/abc').ok, false)
  })

  it('rejects empty URL', () => {
    assert.equal(validateHotmartUrl('').ok, false)
  })

  it('rejects domains with hotmart as substring only', () => {
    assert.equal(validateHotmartUrl('https://www.hotmart.com.phishing.xyz/pay').ok, false)
    assert.equal(validateHotmartUrl('https://fake-hotmart.com/pay').ok, false)
    assert.equal(validateHotmartUrl('https://hotmartcomclone.com/checkout').ok, false)
  })
})

describe('validatePublicImageUrl', () => {
  it('accepts public Supabase Storage images', () => {
    assert.equal(
      validatePublicImageUrl(
        'https://example.supabase.co/storage/v1/object/public/avatars/user/avatar.webp'
      ).ok,
      true
    )
  })

  it('rejects non-storage and non-https image URLs', () => {
    assert.equal(validatePublicImageUrl('https://example.com/avatar.webp').ok, false)
    assert.equal(
      validatePublicImageUrl(
        'http://example.supabase.co/storage/v1/object/public/avatars/avatar.webp'
      ).ok,
      false
    )
  })
})
