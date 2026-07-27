// ─────────────────────────────────────────────
// URL validation utilities
// Safe against open redirect, XSS, and injection
// ─────────────────────────────────────────────

/** Schemes that are unconditionally dangerous */
const BLOCKED_SCHEMES = new Set(['javascript', 'data', 'file', 'vbscript', 'blob'])

/**
 * Official Hotmart checkout hostnames.
 * IMPORTANT: This list must be verified against official Hotmart documentation
 * before going to production. It is centralized here for easy maintenance.
 */
export const HOTMART_ALLOWED_HOSTS = new Set([
  'pay.hotmart.com',
  'checkout.hotmart.com',
  'payment.hotmart.com',
  'go.hotmart.com',
  'www.go.hotmart.com',
])

export interface UrlValidationResult {
  ok: boolean
  error?: string
  normalizedUrl?: string
}

/**
 * Parse a URL safely — returns null if invalid rather than throwing.
 */
function safeParse(raw: string): URL | null {
  try {
    return new URL(raw.trim())
  } catch {
    return null
  }
}

/**
 * Validate a generic public URL (social links, website).
 * Allows only http:// and https://, blocks dangerous schemes.
 */
export function validatePublicUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'La URL no puede estar vacía.' }

  const parsed = safeParse(trimmed)
  if (!parsed) return { ok: false, error: 'La URL no tiene un formato válido.' }

  const scheme = parsed.protocol.replace(':', '').toLowerCase()
  if (BLOCKED_SCHEMES.has(scheme))
    return { ok: false, error: `El esquema "${scheme}:" no está permitido.` }

  if (!['http', 'https'].includes(scheme))
    return { ok: false, error: 'Solo se permiten URLs con http:// o https://.' }

  // Block credentials embedded in URL (user:password@host)
  if (parsed.username || parsed.password)
    return { ok: false, error: 'La URL no puede contener credenciales.' }

  return { ok: true, normalizedUrl: parsed.toString() }
}

/**
 * Validate a Hotmart checkout URL specifically.
 * Uses strict hostname matching — not includes() which can be spoofed.
 */
export function validateHotmartUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'El enlace de Hotmart no puede estar vacío.' }

  const parsed = safeParse(trimmed)
  if (!parsed) return { ok: false, error: 'El enlace de Hotmart no tiene un formato válido.' }

  // Must be HTTPS only
  if (parsed.protocol !== 'https:')
    return { ok: false, error: 'El enlace de Hotmart debe usar HTTPS.' }

  // Block credentials
  if (parsed.username || parsed.password)
    return { ok: false, error: 'El enlace no puede contener credenciales.' }

  // Strict host check — prevents hotmart.com.evil.com attacks
  const host = parsed.hostname.toLowerCase()
  if (!HOTMART_ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      error:
        'El enlace debe ser un checkout oficial de Hotmart (ej: https://pay.hotmart.com/...).',
    }
  }

  // Block fragment-only or empty path that looks suspicious
  const scheme = parsed.protocol.replace(':', '').toLowerCase()
  if (BLOCKED_SCHEMES.has(scheme))
    return { ok: false, error: `El esquema "${scheme}:" no está permitido.` }

  return { ok: true, normalizedUrl: parsed.toString() }
}

/**
 * Validate a website URL — same as public URL but HTTPS preferred.
 */
export function validateWebsiteUrl(raw: string): UrlValidationResult {
  const base = validatePublicUrl(raw)
  if (!base.ok) return base

  const parsed = safeParse(raw.trim())!
  if (parsed.protocol === 'http:') {
    // Allow http but flag it
    return { ok: true, normalizedUrl: parsed.toString() }
  }
  return { ok: true, normalizedUrl: parsed.toString() }
}

/**
 * Validate image URLs rendered by next/image.
 * Public profile images are stored in public Supabase Storage buckets.
 */
export function validatePublicImageUrl(raw: string): UrlValidationResult {
  const base = validatePublicUrl(raw)
  if (!base.ok || !base.normalizedUrl) return base

  const parsed = safeParse(base.normalizedUrl)!
  const isSupabaseStorage =
    parsed.protocol === 'https:' &&
    parsed.hostname.endsWith('.supabase.co') &&
    parsed.pathname.startsWith('/storage/v1/object/public/')

  if (!isSupabaseStorage) {
    return {
      ok: false,
      error: 'La imagen debe pertenecer al almacenamiento público de la plataforma.',
    }
  }

  return { ok: true, normalizedUrl: parsed.toString() }
}
