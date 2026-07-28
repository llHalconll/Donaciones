import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { parseLegalDocument } from '../src/lib/legal-document'

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

function normalizedHash(source: string) {
  return createHash('sha256')
    .update(source.replace(/\r\n?/g, '\n').trimEnd())
    .digest('hex')
}

function normalizedSourceLines(source: string) {
  return source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/^•\s+/, ''))
    .filter(Boolean)
}

function parsedDocumentLines(source: string) {
  const document = parseLegalDocument(source)

  return [
    document.title,
    document.versionLine,
    document.updatedLine,
    ...document.sections.flatMap((section) => [
      section.heading,
      ...section.blocks.flatMap((block) =>
        block.type === 'list' ? block.items : [block.text]
      ),
    ]),
  ]
}

const termsSource = read('src/content/legal/terms.txt')
const privacySource = read('src/content/legal/privacy.txt')
const termsPage = read('src/app/(legal)/terms/page.tsx')
const privacyPage = read('src/app/(legal)/privacy/page.tsx')
const legalLayout = read('src/components/legal/legal-layout.tsx')
const legalRoutesLayout = read('src/app/(legal)/layout.tsx')
const rootLayout = read('src/app/layout.tsx')
const footer = read('src/components/shared/footer.tsx')
const loginPage = read('src/app/auth/login/page.tsx')

describe('legal document integrity', () => {
  it('keeps the supplied Terms and Conditions text unchanged', () => {
    assert.equal(
      normalizedHash(termsSource),
      '13691824ebd44d0aedf0e02a788ff917fbc47e3ed0f8383c8e6d9d3bf6c2ac1e'
    )
  })

  it('keeps the supplied Privacy Policy text unchanged', () => {
    assert.equal(
      normalizedHash(privacySource),
      '707893b75c4f09fed2d2948645615508300f6ecd716b5549049da5560fd22318'
    )
  })

  it('parses every numbered section and preserves document metadata', () => {
    const terms = parseLegalDocument(termsSource)
    const privacy = parseLegalDocument(privacySource)

    assert.equal(terms.title, 'TÉRMINOS Y CONDICIONES DE USO')
    assert.equal(terms.versionLine, 'Versión: 2026-07-28-draft-1')
    assert.equal(terms.sections.length, 42)
    assert.equal(terms.sections.at(-1)?.heading, '42. ENTRADA EN VIGOR')

    assert.equal(privacy.title, 'POLÍTICA DE PRIVACIDAD')
    assert.equal(privacy.versionLine, 'Versión: 2026-07-28-draft-1')
    assert.equal(privacy.sections.length, 31)
    assert.equal(privacy.sections.at(-1)?.heading, 'DISPOSICIÓN FINAL')
  })

  it('renders every non-empty legal line in its original order', () => {
    assert.deepEqual(parsedDocumentLines(termsSource), normalizedSourceLines(termsSource))
    assert.deepEqual(
      parsedDocumentLines(privacySource),
      normalizedSourceLines(privacySource)
    )
  })
})

describe('legal page integration', () => {
  it('builds both routes as static pages without Supabase access', () => {
    for (const page of [termsPage, privacyPage]) {
      assert.match(page, /export const dynamic = 'force-static'/)
      assert.match(page, /readFileSync/)
      assert.doesNotMatch(page, /supabase|createClient|cookies\(/i)
    }
  })

  it('defines complete search and social metadata', () => {
    for (const page of [termsPage, privacyPage]) {
      assert.match(page, /alternates: \{ canonical \}/)
      assert.match(page, /robots: \{ index: true, follow: true \}/)
      assert.match(page, /openGraph:/)
      assert.match(page, /twitter:/)
      assert.match(page, /application\/ld\+json/)
      assert.match(page, /DigitalDocument/)
    }
  })

  it('uses semantic, responsive navigation around the legal content', () => {
    assert.match(legalLayout, /<article/)
    assert.match(legalLayout, /<header/)
    assert.match(legalLayout, /<nav/)
    assert.match(legalLayout, /<section/)
    assert.match(legalLayout, /<footer/)
    assert.match(legalLayout, /<details/)
    assert.match(legalLayout, /lg:hidden/)
    assert.match(legalLayout, /sticky top-24/)
    assert.match(legalRoutesLayout, /<main/)
  })

  it('links both policies from the global footer and login', () => {
    for (const source of [footer, loginPage]) {
      assert.match(source, /href="\/terms"/)
      assert.match(source, /href="\/privacy"/)
      assert.match(source, /Términos y Condiciones/)
      assert.match(source, /Política de Privacidad/)
    }
  })

  it('mounts one fixed footer globally without authentication queries', () => {
    assert.match(rootLayout, /<PublicFooter \/>/)
    assert.match(footer, /fixed inset-x-0 bottom-0/)
    assert.match(footer, /href="\/dashboard"/)
    assert.doesNotMatch(footer, /getAuthUser|supabase/)
  })
})
