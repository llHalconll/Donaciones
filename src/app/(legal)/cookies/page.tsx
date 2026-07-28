import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { LegalLayout } from '@/components/legal/legal-layout'
import { COOKIE_POLICY_VERSION } from '@/lib/cookie-consent'
import { resolveSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-static'

const cookiesSource = readFileSync(
  join(process.cwd(), 'src/content/legal/cookies.txt'),
  'utf8'
)

export function generateMetadata(): Metadata {
  const canonical = `${resolveSiteUrl()}/cookies`
  const title = 'Política de Cookies | DonacionesSaaS'
  const description =
    'Consulta qué cookies y tecnologías similares utiliza DonacionesSaaS y administra tus preferencias.'

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

export default function CookiesPage() {
  const canonical = `${resolveSiteUrl()}/cookies`
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: 'POLÍTICA DE COOKIES',
    version: COOKIE_POLICY_VERSION,
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
        source={cookiesSource}
        relatedDocuments={[
          {
            href: '/terms',
            label: 'Consultar los Términos y Condiciones',
          },
          {
            href: '/privacy',
            label: 'Consultar la Política de Privacidad',
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
