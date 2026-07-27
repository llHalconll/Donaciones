type PublicConfigurationEnvironment = Readonly<Record<string, string | undefined>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEMO_USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/

export function normalizeSupportEmail(rawValue: string | undefined): string | null {
  const email = rawValue?.trim().toLowerCase()
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) return null
  return email
}

export function getSupportEmail(
  env: PublicConfigurationEnvironment = process.env
): string | null {
  return normalizeSupportEmail(env.NEXT_PUBLIC_SUPPORT_EMAIL)
}

export function normalizeDemoUsername(rawValue: string | undefined): string | null {
  const username = rawValue?.trim().toLowerCase()
  if (!username || !DEMO_USERNAME_PATTERN.test(username)) return null
  return username
}

export function getDemoUsername(
  env: PublicConfigurationEnvironment = process.env
): string | null {
  return normalizeDemoUsername(env.NEXT_PUBLIC_DEMO_USERNAME)
}
