'use server'

import { createClient } from '@/lib/supabase/server'
import { validateUsernameFormat } from '@/lib/validations/auth'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ActionResult {
  error?: string
  success?: string
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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
// Update text-only profile fields
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

  // Check username uniqueness (exclude current user)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: `El usuario "@${username}" ya está en uso.` }

  // Update — only safe fields. Never touch is_admin, is_active, id, created_at.
  const { error: dbError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio,
      username,
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
// Upload avatar to Storage and update profile
// ─────────────────────────────────────────────
export async function uploadAvatarAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No se seleccionó ningún archivo.' }

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type.toLowerCase()))
    return { error: 'Solo se permiten imágenes JPG, JPEG, PNG o WebP.' }
  if (file.size > 2 * 1024 * 1024) return { error: 'El avatar no puede superar 2 MB.' }

  // Path is always {user_id}/avatar.webp — user cannot inject arbitrary paths
  const storagePath = `${user.id}/avatar.webp`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, {
      upsert: true,
      contentType: 'image/webp',
    })

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
// Upload banner to Storage and update profile
// ─────────────────────────────────────────────
export async function uploadBannerAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getAuthenticatedUser()
  if (!user) return { error: 'No estás autenticado.' }

  const file = formData.get('banner') as File | null
  if (!file || file.size === 0) return { error: 'No se seleccionó ningún archivo.' }

  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type.toLowerCase()))
    return { error: 'Solo se permiten imágenes JPG, JPEG, PNG o WebP.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'El banner no puede superar 5 MB.' }

  const storagePath = `${user.id}/banner.webp`

  const { error: uploadError } = await supabase.storage
    .from('banners')
    .upload(storagePath, file, {
      upsert: true,
      contentType: 'image/webp',
    })

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
// Check username availability (route handler helper)
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
