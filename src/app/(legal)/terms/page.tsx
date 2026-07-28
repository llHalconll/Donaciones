import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'
import { resolveSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-static'

const termsSource = readFileSync(
  join(process.cwd(), 'src/content/legal/terms.txt'),
  'utf8'
)

export function generateMetadata(): Metadata {
  const canonical = `${resolveSiteUrl()}/terms`
  const title = 'Términos y Condiciones de Uso | DonacionesSaaS'
  const description =
    'Consulta los Términos y Condiciones que regulan el acceso y uso de DonacionesSaaS.'

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url: canonical,
      title,
      description,
      siteName: 'DonacionesSaaS',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function TermsPage() {
  const canonical = `${resolveSiteUrl()}/terms`
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: 'TÉRMINOS Y CONDICIONES DE USO',
    version: '2026-07-28-draft-1',
    dateModified: '2026-07-28',
    inLanguage: 'es-CO',
    url: canonical,
    publisher: {
      '@type': 'Person',
      name: 'Víctor Alfonso Cuadrado Mestra',
    },
  }

  return (
    <>
      <LegalLayout
        source={termsSource}
        relatedDocument={{
          href: '/privacy',
          label: 'Consultar la Política de Privacidad',
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
    </>
  )
}
