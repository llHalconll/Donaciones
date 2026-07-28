import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'
import { resolveSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-static'

const privacySource = readFileSync(
  join(process.cwd(), 'src/content/legal/privacy.txt'),
  'utf8'
)

export function generateMetadata(): Metadata {
  const canonical = `${resolveSiteUrl()}/privacy`
  const title = 'Política de Privacidad | DonacionesSaaS'
  const description =
    'Conoce cómo DonacionesSaaS recopila, utiliza, protege, conserva y elimina los datos personales.'

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

export default function PrivacyPage() {
  const canonical = `${resolveSiteUrl()}/privacy`
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: 'POLÍTICA DE PRIVACIDAD',
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
        source={privacySource}
        relatedDocuments={[
          {
            href: '/terms',
            label: 'Consultar los Términos y Condiciones',
          },
          {
            href: '/cookies',
            label: 'Consultar la Política de Cookies',
          },
        ]}
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
