import { MetadataRoute } from 'next'
import { resolveSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/auth', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
