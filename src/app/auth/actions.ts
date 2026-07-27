'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  authLimiter,
  buildAuthRateLimitKey,
  checkRateLimit,
  getTrustedClientIp,
  normalizeRateLimitEmail,
  type AuthRateLimitAction,
  type RateLimitResult,
} from '@/lib/rate-limit'
import { resolveSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'
import { validateUsernameFormat } from '@/lib/validations/auth'

type AuthActionError = {
  error: string
  retryAfter?: number
}

type AuthActionState = {
  error?: string
  success?: string
  retryAfter?: number
}

function toAuthActionError(result: RateLimitResult): AuthActionError {
  if (result.reason === 'unavailable') {
    return {
      error: 'El servicio de autenticación no está disponible en este momento. Intenta de nuevo más tarde.',
      retryAfter: result.retryAfter,
    }
  }
  return {
    error: `Demasiados intentos. Espera ${result.retryAfter ?? 60} segundos antes de volver a intentarlo.`,
    retryAfter: result.retryAfter,
  }
}

async function enforceAuthRateLimit(
  action: AuthRateLimitAction,
  email?: string
): Promise<AuthActionError | null> {
  const requestHeaders = await headers()
  const trustedIp = getTrustedClientIp(requestHeaders)
  const result = await checkRateLimit(
    authLimiter,
    buildAuthRateLimitKey(action, email, trustedIp)
  )

  return result.allowed ? null : toAuthActionError(result)
}

export async function googleOAuthAction() {
  const rateLimitError = await enforceAuthRateLimit('google-oauth')
  // For OAuth, rate-limit blocks redirect to /auth/login with a query param
  // so the page can surface the message — returning an object here would work
  // but we keep the pattern consistent with the other actions.
  if (rateLimitError) return rateLimitError

  const supabase = await createClient()
  const siteUrl = resolveSiteUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    redirect('/auth/login?error=OAuthFailed')
  }

  redirect(data.url)
}

export async function registerAction(prevState: unknown, formData: FormData) {
  const email = normalizeRateLimitEmail(String(formData.get('email') ?? ''))
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('displayName') ?? '').trim()
  const rawUsername = String(formData.get('username') ?? '')

  if (!email || !password || !displayName || !rawUsername) {
    return { error: 'Todos los campos son obligatorios.' }
  }

  const rateLimitError = await enforceAuthRateLimit('register', email)
  if (rateLimitError) return rateLimitError

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const username = rawUsername.toLowerCase().trim()
  const formatCheck = validateUsernameFormat(username)
  if (!formatCheck.ok) {
    return { error: formatCheck.error }
  }

  const supabase = await createClient()
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: `El usuario "${username}" ya está registrado. Elige otro.` }
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  })

  if (signUpError) {
    return { error: 'No se pudo crear la cuenta con esos datos. Revisa la información e intenta de nuevo.' }
  }

  redirect('/dashboard')
}

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = normalizeRateLimitEmail(String(formData.get('email') ?? ''))
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Correo y contraseña requeridos.' }
  }

  const rateLimitError = await enforceAuthRateLimit('login', email)
  if (rateLimitError) return rateLimitError

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales inválidas. Revisa tu correo y contraseña.' }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function forgotPasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeRateLimitEmail(String(formData.get('email') ?? ''))

  if (!email) {
    return { error: 'Ingresa un correo electrónico válido.' }
  }

  const rateLimitError = await enforceAuthRateLimit('forgot-password', email)
  if (rateLimitError) return rateLimitError

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${resolveSiteUrl()}/auth/reset-password`,
  })

  if (error) {
    console.warn('[auth] No se pudo completar una solicitud de recuperación.')
  }

  return {
    success: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación.',
  }
}

export async function resetPasswordAction(prevState: unknown, formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  const rateLimitError = await enforceAuthRateLimit('reset-password')
  if (rateLimitError) return rateLimitError

  if (!password || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'No se pudo actualizar la contraseña. Solicita un enlace nuevo e intenta de nuevo.' }
  }

  redirect('/dashboard')
}
