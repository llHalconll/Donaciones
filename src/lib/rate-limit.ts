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

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[rate-limit] Redis no está configurado; las rutas protegidas responderán 503.')
    }
    return null
  }

  return new Redis({ url, token })
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
  if (environment === 'production') {
    return { allowed: false, reason: 'unavailable', retryAfter: 60 }
  }

  console.warn('[rate-limit] Redis no disponible; se permite la solicitud solo fuera de producción.')
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
