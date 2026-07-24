export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/

export function validateUsernameFormat(raw: string): { ok: boolean; error?: string } {
  const u = raw.trim().toLowerCase()

  if (!u) return { ok: false, error: 'El nombre de usuario es obligatorio.' }
  if (/\s/.test(u)) return { ok: false, error: 'El usuario no puede contener espacios.' }
  if (u.length < 3 || u.length > 30)
    return { ok: false, error: 'El usuario debe tener entre 3 y 30 caracteres.' }
  if (!USERNAME_PATTERN.test(u))
    return {
      ok: false,
      error: 'Solo se permiten letras minúsculas, números, guion (-) y guion bajo (_).',
    }

  return { ok: true }
}
