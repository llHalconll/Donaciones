// ─────────────────────────────────────────────
// Username validation
// ─────────────────────────────────────────────

export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/

/** Usernames that map to existing app routes or are reserved by the platform */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'dashboard',
  'login',
  'register',
  'auth',
  'api',
  'settings',
  'support',
  'help',
  'terms',
  'privacy',
  'pricing',
  'about',
  'reports',
  'legal',
  'sitemap',
  'robots',
  'blog',
  'faq',
  'contact',
  'careers',
  'press',
  'media',
  'brand',
  'status',
  'docs',
  'dev',
  'app',
  'www',
  'mail',
  'smtp',
  'cdn',
  'static',
  'assets',
  'images',
  'files',
  'upload',
  'download',
  'demo',
  'test',
  'root',
  'system',
  'null',
  'undefined',
])

export function validateUsernameFormat(raw: string): { ok: boolean; error?: string } {
  const u = raw.trim()

  if (!u) return { ok: false, error: 'El nombre de usuario es obligatorio.' }
  if (/\s/.test(u)) return { ok: false, error: 'El usuario no puede contener espacios.' }
  if (u.length < 3 || u.length > 30)
    return { ok: false, error: 'El usuario debe tener entre 3 y 30 caracteres.' }

  // Explicitly reject uppercase — callers must lowercase before calling this function
  if (u !== u.toLowerCase())
    return { ok: false, error: 'El usuario debe estar en minúsculas.' }

  if (!USERNAME_PATTERN.test(u))
    return {
      ok: false,
      error: 'Solo se permiten letras minúsculas, números, guion (-) y guion bajo (_).',
    }
  if (RESERVED_USERNAMES.has(u))
    return { ok: false, error: `"${u}" es un nombre de usuario reservado.` }

  return { ok: true }
}
