/**
 * Rate Limiting — Upstash Redis + @upstash/ratelimit
 *
 * For production (Vercel serverless), in-memory Maps are NOT shared between
 * instances. This module uses Upstash Redis for persistent, distributed rate
 * limiting that works across all serverless instances.
 *
 * Required environment variables:
 *   UPSTASH_REDIS_REST_URL   — REST URL from Upstash console
 *   UPSTASH_REDIS_REST_TOKEN — Token from Upstash console
 *
 * Behavior when Redis is NOT configured (variables missing):
 *   - Falls back to a permissive mode (allows all requests) with a console warning.
 *   - This ensures the app does not break during local dev or if Redis is misconfigured.
 *   - Change RATE_LIMIT_FAIL_OPEN = false to block all requests when Redis is unavailable.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/** If true, requests are allowed when Redis is unavailable. Set false for strict mode. */
const RATE_LIMIT_FAIL_OPEN = true

// ─────────────────────────────────────────────
// Redis client (lazy — only if env vars exist)
// ─────────────────────────────────────────────

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. ' +
        'Rate limiting is DISABLED. Configure Upstash Redis for production.'
      )
    }
    return null
  }
  return new Redis({ url, token })
}

const redis = createRedis()

// ─────────────────────────────────────────────
// Rate limiter instances
// ─────────────────────────────────────────────

/**
 * Analytics events — 30 events per 60s per session
 * Prevents event flood from a single visitor
 */
export const analyticsLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '60 s'),
      analytics: false,
      prefix: 'rl:analytics',
    })
  : null

/**
 * Report submissions — 5 reports per hour per IP
 * Prevents report spam
 */
export const reportLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 m'),
      analytics: false,
      prefix: 'rl:reports',
    })
  : null

/**
 * Auth actions (login, register, forgot-password) — 10 per 10 minutes per IP
 * Prevents credential stuffing and brute force
 */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'),
      analytics: false,
      prefix: 'rl:auth',
    })
  : null

// ─────────────────────────────────────────────
// Helper: check rate limit and return result
// ─────────────────────────────────────────────

export interface RateLimitResult {
  /** true = request is allowed */
  allowed: boolean
  /** Seconds until the window resets (for Retry-After header) */
  retryAfter?: number
}

/**
 * Check a rate limiter with the given identifier.
 * Returns { allowed: true } when Redis is not configured (fail-open).
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    // Fail-open: no Redis configured
    return { allowed: RATE_LIMIT_FAIL_OPEN }
  }

  try {
    const result = await limiter.limit(identifier)
    if (result.success) return { allowed: true }

    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) }
  } catch (err) {
    console.error('[rate-limit] Redis error:', err)
    // Fail-open on Redis errors to avoid blocking legitimate users
    return { allowed: RATE_LIMIT_FAIL_OPEN }
  }
}
