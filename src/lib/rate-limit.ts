import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimiterLike {
  limit(identifier: string): Promise<{ success: boolean; reset: number }>
}

type ProxyEnvironment = Readonly<Record<string, string | undefined>>

export type RateLimitReason = 'limited' | 'unavailable'

export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
  reason?: RateLimitReason
}

// Returns true only when running in a real production deployment.
// Vercel preview deployments expose VERCEL_ENV='preview', not 'production'.
function isProductionDeployment(): boolean {
  if (process.env.NODE_ENV !== 'production') return false
  // On Vercel, VERCEL_ENV differentiates production from preview branches.
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv !== undefined) return vercelEnv === 'production'
  // Outside Vercel (Railway, Fly, self-hosted) treat NODE_ENV=production as-is.
  return true
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url && !token) {
    if (isProductionDeployment()) {
      console.error(
        '[rate-limit] UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN no están configuradas. ' +
        'La autenticación estará deshabilitada hasta que se configuren en las variables de entorno de producción.'
      )
    } else {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN no están configuradas. ' +
        'Rate limiting deshabilitado fuera de producción.'
      )
    }
    return null
  }

  if (!url) {
    console.error('[rate-limit] Falta UPSTASH_REDIS_REST_URL. Configúrala en las variables de entorno.')
    return null
  }

  if (!token) {
    console.error('[rate-limit] Falta UPSTASH_REDIS_REST_TOKEN. Configúrala en las variables de entorno.')
    return null
  }

  return new Redis({ url, token })
}

/** True when both Upstash env vars are present. Use for startup/build validation. */
export function isRateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

const redis = createRedis()

export const analyticsLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      analytics: false,
      prefix: 'rl:analytics',
    })
  : null

export const reportLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 m'),
      analytics: false,
      prefix: 'rl:reports',
    })
  : null

export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'),
      analytics: false,
      prefix: 'rl:auth',
    })
  : null

export function getUnavailableRateLimitResult(
  environment = process.env.NODE_ENV
): RateLimitResult {
  // Fail-closed only in real production deployments.
  // Preview branches and local dev always fail-open so auth remains testable.
  if (isProductionDeployment()) {
    return { allowed: false, reason: 'unavailable', retryAfter: 60 }
  }

  if (environment !== 'test') {
    console.warn('[rate-limit] Redis no disponible; se permite la solicitud fuera de producción.')
  }
  return { allowed: true, reason: 'unavailable' }
}

export async function checkRateLimit(
  limiter: RateLimiterLike | null,
  identifier: string,
  environment = process.env.NODE_ENV
): Promise<RateLimitResult> {
  if (!limiter) return getUnavailableRateLimitResult(environment)

  try {
    const result = await limiter.limit(identifier)
    if (result.success) return { allowed: true }

    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    return {
      allowed: false,
      reason: 'limited',
      retryAfter: Math.max(retryAfter, 1),
    }
  } catch {
    console.error('[rate-limit] Redis no respondió; se aplicó el modo seguro del entorno.')
    return getUnavailableRateLimitResult(environment)
  }
}

function normalizeIpCandidate(rawValue: string | null): string | null {
  const firstValue = rawValue?.split(',')[0]?.trim()
  if (!firstValue) return null

  const bracketedIpv6 = firstValue.match(/^\[([^\]]+)\](?::\d+)?$/)
  if (bracketedIpv6 && isIP(bracketedIpv6[1])) return bracketedIpv6[1]

  if (isIP(firstValue)) return firstValue

  const ipv4WithPort = firstValue.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/)
  if (ipv4WithPort && isIP(ipv4WithPort[1])) return ipv4WithPort[1]

  return null
}

export function getTrustedClientIp(
  headers: Pick<Headers, 'get'>,
  env: ProxyEnvironment = process.env
): string {
  const isTrustedVercelProxy = env.VERCEL === '1' || Boolean(env.VERCEL_ENV)
  if (!isTrustedVercelProxy) return 'unknown'

  return (
    normalizeIpCandidate(headers.get('x-vercel-forwarded-for')) ??
    normalizeIpCandidate(headers.get('x-forwarded-for')) ??
    'unknown'
  )
}

function hashRateLimitValue(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 32)
}

export function buildRateLimitKey(scope: string, values: Array<string | null | undefined>) {
  const normalizedValues = values.map((value) => value?.trim() || 'unknown')
  return `${scope}:${hashRateLimitValue(normalizedValues.join('|'))}`
}

export type AuthRateLimitAction =
  | 'google-oauth'
  | 'register'
  | 'login'
  | 'forgot-password'
  | 'reset-password'

export function normalizeRateLimitEmail(email: string | undefined) {
  return email?.trim().toLowerCase() || null
}

export function buildAuthRateLimitKey(
  action: AuthRateLimitAction,
  email: string | undefined,
  ip: string
) {
  return buildRateLimitKey(`auth:${action}`, [normalizeRateLimitEmail(email), ip])
}
