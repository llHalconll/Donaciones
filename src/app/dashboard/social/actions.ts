'use server'

import { createClient } from '@/lib/supabase/server'
import { validatePublicUrl } from '@/lib/validations/url'
import { PLAN_LIMITS } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

interface ActionResult { error?: string; success?: string }

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function addSocialLinkAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const platform = (formData.get('platform') as string | null)?.trim() ?? ''
  const url = (formData.get('url') as string | null)?.trim() ?? ''
  const label = (formData.get('label') as string | null)?.trim() || null

  if (!platform) return { error: 'Selecciona una plataforma.' }
  if (!url) return { error: 'El enlace es obligatorio.' }

  const urlCheck = validatePublicUrl(url)
  if (!urlCheck.ok) return { error: urlCheck.error }

  // Check plan limits
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan as 'free' | 'pro' | 'organization') ?? 'free'
  const limit = PLAN_LIMITS[plan].socialLinks

  const { count } = await supabase
    .from('social_links')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  if ((count ?? 0) >= limit)
    return { error: `Tu plan ${plan} permite un máximo de ${limit} redes sociales.` }

  // Get next order_index
  const { data: lastLink } = await supabase
    .from('social_links')
    .select('order_index')
    .eq('profile_id', user.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextIndex = (lastLink?.order_index ?? -1) + 1

  const { error } = await supabase.from('social_links').insert({
    profile_id: user.id,
    platform,
    label,
    url: urlCheck.normalizedUrl ?? url,
    is_active: true,
    order_index: nextIndex,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/social')
  revalidatePath(`/${user.id}`)
  return { success: 'Enlace agregado correctamente.' }
}

export async function updateSocialLinkAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const url = (formData.get('url') as string | null)?.trim() ?? ''
  const label = (formData.get('label') as string | null)?.trim() || null
  const isActiveRaw = formData.get('isActive')
  const isActive = isActiveRaw === 'true'

  if (!id) return { error: 'ID inválido.' }
  if (!url) return { error: 'El enlace es obligatorio.' }

  const urlCheck = validatePublicUrl(url)
  if (!urlCheck.ok) return { error: urlCheck.error }

  // Verify ownership — RLS also enforces this server-side
  const { data: existing } = await supabase
    .from('social_links')
    .select('profile_id')
    .eq('id', id)
    .single()

  if (!existing || existing.profile_id !== user.id) return { error: 'No tienes permiso para editar este enlace.' }

  const { error } = await supabase
    .from('social_links')
    .update({ url: urlCheck.normalizedUrl ?? url, label, is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/social')
  return { success: 'Enlace actualizado.' }
}

export async function deleteSocialLinkAction(id: string): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const { error } = await supabase
    .from('social_links')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/social')
  return { success: 'Enlace eliminado.' }
}

export async function toggleSocialLinkAction(id: string, isActive: boolean): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const { error } = await supabase
    .from('social_links')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/social')
  return { success: isActive ? 'Enlace activado.' : 'Enlace desactivado.' }
}

export async function reorderSocialLinksAction(orderedIds: string[]): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  // Batch update order_index
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('social_links')
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('profile_id', user.id)
  )

  await Promise.all(updates)
  revalidatePath('/dashboard/social')
  return { success: 'Orden actualizado.' }
}
