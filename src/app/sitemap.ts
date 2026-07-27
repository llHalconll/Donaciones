import { MetadataRoute } from 'next'
import { getDemoUsername } from '@/lib/public-config'
import { resolveSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveSiteUrl()
  const demoUsername = getDemoUsername()

  const routes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  if (demoUsername) {
    routes.push({ url: `${base}/demo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 })
  }

  return routes
}
