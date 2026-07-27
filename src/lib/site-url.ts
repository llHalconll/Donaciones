export class SiteUrlConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteUrlConfigurationError'
  }
}

type SiteUrlEnvironment = Partial<Record<
  | 'NEXT_PUBLIC_SITE_URL'
  | 'VERCEL_PROJECT_PRODUCTION_URL'
  | 'VERCEL_URL'
  | 'VERCEL_ENV'
  | 'NODE_ENV'
  | 'NEXT_PHASE',
  string | undefined
>>

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

function hasProtocol(value: string) {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(value)
}

export function normalizeSiteUrl(rawValue: string | undefined): string | null {
  const value = rawValue?.trim()
  if (!value) return null

  const candidate = hasProtocol(value)
    ? value
    : `${LOCAL_HOSTNAMES.has(value.split(':')[0].toLowerCase()) ? 'http' : 'https'}://${value}`

  try {
    const parsed = new URL(candidate)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    if (!parsed.hostname || parsed.username || parsed.password) return null
    if (parsed.pathname !== '/' || parsed.search || parsed.hash) return null

    return parsed.origin
  } catch {
    return null
  }
}

function isProductionRuntime(env: SiteUrlEnvironment) {
  if (env.VERCEL_ENV === 'production') return true

  // `next build` sets NODE_ENV=production even on a developer machine. The
  // runtime still validates production configuration when the server starts.
  return env.NODE_ENV === 'production' && env.NEXT_PHASE !== 'phase-production-build'
}

export function resolveSiteUrl(
  env: SiteUrlEnvironment = process.env
): string {
  const candidates = [
    env.NEXT_PUBLIC_SITE_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeSiteUrl(candidate)
    if (!normalized) continue

    const hostname = new URL(normalized).hostname
    if (isProductionRuntime(env) && LOCAL_HOSTNAMES.has(hostname)) continue

    return normalized
  }

  if (!isProductionRuntime(env)) return 'http://localhost:3000'

  throw new SiteUrlConfigurationError(
    'No hay una URL pública válida. Configura NEXT_PUBLIC_SITE_URL con el dominio real.'
  )
}

export function formatPublicProfileUrl(siteUrl: string, username: string) {
  const host = new URL(siteUrl).host
  return `${host}/${username}`
}
