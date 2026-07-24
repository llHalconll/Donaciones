'use server'

import { createClient } from '@/lib/supabase/server'
import { validateUsernameFormat } from '@/lib/validations/auth'
import { validateWebsiteUrl } from '@/lib/validations/url'
import { revalidatePath } from 'next/cache'
import type { AccountType } from '@/types/database.types'

interface ActionResult {
  error?: string
  success?: string
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase }
  return { user, supabase }
}

// ─────────────────────────────────────────────
// Update text profile fields (display_name, username, bio, account_type, website_url)
// ─────────────────────────────────────────────
export async function updateProfileAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  const rawDisplayName = (formData.get('displayName') as string | null) ?? ''
  const rawBio = (formData.get('bio') as string | null) ?? ''
  const rawUsername = (formData.get('username') as string | null) ?? ''
  const rawAccountType = (formData.get('accountType') as string | null) ?? 'individual'
  const rawWebsiteUrl = (formData.get('websiteUrl') as string | null) ?? ''

  // Validate display_name
  const displayName = rawDisplayName.trim()
  if (!displayName) return { error: 'El nombre visible es obligatorio.' }
  if (displayName.length > 60) return { error: 'El nombre no puede superar los 60 caracteres.' }

  // Validate bio
  const bio = rawBio.trim() || null
  if (bio && bio.length > 250) return { error: 'La biografía no puede superar los 250 caracteres.' }

  // Validate username
  const username = rawUsername.toLowerCase().replace(/\s+/g, '')
  const usernameCheck = validateUsernameFormat(username)
  if (!usernameCheck.ok) return { error: usernameCheck.error }

  // Validate account_type
  const accountType: AccountType =
    rawAccountType === 'organization' ? 'organization' : 'individual'

  // Validate website_url
  let websiteUrl: string | null = null
  if (rawWebsiteUrl.trim()) {
    const urlCheck = validateWebsiteUrl(rawWebsiteUrl.trim())
    if (!urlCheck.ok) return { error: urlCheck.error }
    websiteUrl = urlCheck.normalizedUrl ?? rawWebsiteUrl.trim()
  }

  // Check username uniqueness (exclude current user)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: `El usuario "@${username}" ya está en uso.` }

  // Update — only safe fields. NEVER touch is_admin, is_active, plan, id, created_at.
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio,
      username,
      account_type: accountType,
      website_url: websiteUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  revalidatePath(`/${username}`)

  return { success: 'Perfil actualizado correctamente.' }
}

// ─────────────────────────────────────────────
// Upload avatar
// ─────────────────────────────────────────────
export async function uploadAvatarAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No se seleccionó ningún archivo.' }

  const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  if (!ALLOWED.has(file.type.toLowerCase()))
    return { error: 'Solo se permiten imágenes JPG, JPEG, PNG o WebP.' }
  if (file.size > 3 * 1024 * 1024) return { error: 'El avatar no puede superar 3 MB.' }

  // Path scoped to user's folder — RLS enforces this server-side too
  const storagePath = `${user.id}/avatar.webp`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, { upsert: true, contentType: 'image/webp' })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(storagePath)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/profile')
  return { success: 'Avatar actualizado correctamente.' }
}

// ─────────────────────────────────────────────
// Upload banner
// ─────────────────────────────────────────────
export async function uploadBannerAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  const file = formData.get('banner') as File | null
  if (!file || file.size === 0) return { error: 'No se seleccionó ningún archivo.' }

  const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  if (!ALLOWED.has(file.type.toLowerCase()))
    return { error: 'Solo se permiten imágenes JPG, JPEG, PNG o WebP.' }
  if (file.size > 6 * 1024 * 1024) return { error: 'El banner no puede superar 6 MB.' }

  const storagePath = `${user.id}/banner.webp`

  const { error: uploadError } = await supabase.storage
    .from('banners')
    .upload(storagePath, file, { upsert: true, contentType: 'image/webp' })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('banners').getPublicUrl(storagePath)
  const bannerUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('profiles')
    .update({ banner_url: bannerUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/dashboard/profile')
  return { success: 'Banner actualizado correctamente.' }
}

// ─────────────────────────────────────────────
// Remove avatar
// ─────────────────────────────────────────────
export async function removeAvatarAction(): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  await supabase.storage.from('avatars').remove([`${user.id}/avatar.webp`])

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/profile')
  return { success: 'Avatar eliminado.' }
}

// ─────────────────────────────────────────────
// Remove banner
// ─────────────────────────────────────────────
export async function removeBannerAction(): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  await supabase.storage.from('banners').remove([`${user.id}/banner.webp`])

  const { error } = await supabase
    .from('profiles')
    .update({ banner_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/profile')
  return { success: 'Banner eliminado.' }
}

// ─────────────────────────────────────────────
// Check username availability (used for live check)
// ─────────────────────────────────────────────
export async function checkUsernameAvailabilityAction(
  username: string,
  currentUserId: string
): Promise<{ available: boolean; error?: string }> {
  const check = validateUsernameFormat(username)
  if (!check.ok) return { available: false, error: check.error }

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .neq('id', currentUserId)
    .maybeSingle()

  return { available: !data }
}
