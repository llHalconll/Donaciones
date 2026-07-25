'use server'

import { createClient } from '@/lib/supabase/server'
import { validateHotmartUrl } from '@/lib/validations/url'
import { PLAN_LIMITS } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

interface ActionResult { error?: string; success?: string }

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

export async function createButtonAction(prevState: unknown, formData: FormData): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const amountRaw = formData.get('amount') as string
  const currency = (formData.get('currency') as string | null)?.trim() || 'USD'
  const hotmartUrl = (formData.get('hotmartUrl') as string | null)?.trim() ?? ''
  const buttonLabel = (formData.get('buttonLabel') as string | null)?.trim() || null
  const isFeaturedRaw = formData.get('isFeatured')
  const emoji = (formData.get('emoji') as string | null)?.trim() || null

  if (!title) return { error: 'El título es obligatorio.' }
  if (title.length > 80) return { error: 'El título no puede superar 80 caracteres.' }

  const amount = parseFloat(amountRaw)
  if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a cero.' }
  if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) return { error: 'El monto permite máximo 2 decimales.' }

  const urlCheck = validateHotmartUrl(hotmartUrl)
  if (!urlCheck.ok) return { error: urlCheck.error }

  // Plan limit check
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan as 'free' | 'pro' | 'organization') ?? 'free'
  const limit = PLAN_LIMITS[plan].buttons

  const { count } = await supabase
    .from('donation_buttons')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('is_active', true)

  if ((count ?? 0) >= limit)
    return { error: `Tu plan ${plan} permite un máximo de ${limit} botones activos.` }

  // If featured, unset others
  const isFeatured = isFeaturedRaw === 'true'
  if (isFeatured) {
    await supabase.from('donation_buttons').update({ is_featured: false }).eq('profile_id', user.id)
  }

  // Next order index
  const { data: last } = await supabase
    .from('donation_buttons').select('order_index').eq('profile_id', user.id)
    .order('order_index', { ascending: false }).limit(1).maybeSingle()
  const nextIndex = (last?.order_index ?? -1) + 1

  const { error } = await supabase.from('donation_buttons').insert({
    profile_id: user.id, title, emoji, description,
    amount, currency: currency.toUpperCase(),
    hotmart_checkout_url: urlCheck.normalizedUrl ?? hotmartUrl,
    button_label: buttonLabel, is_active: true, is_featured: isFeatured,
    order_index: nextIndex, updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/buttons')
  return { success: 'Botón creado correctamente.' }
}

export async function updateButtonAction(prevState: unknown, formData: FormData): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const amountRaw = formData.get('amount') as string
  const hotmartUrl = (formData.get('hotmartUrl') as string | null)?.trim() ?? ''
  const buttonLabel = (formData.get('buttonLabel') as string | null)?.trim() || null
  const isFeatured = formData.get('isFeatured') === 'true'
  const emoji = (formData.get('emoji') as string | null)?.trim() || null

  if (!id) return { error: 'ID inválido.' }
  if (!title) return { error: 'El título es obligatorio.' }

  const amount = parseFloat(amountRaw)
  if (isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a cero.' }

  const urlCheck = validateHotmartUrl(hotmartUrl)
  if (!urlCheck.ok) return { error: urlCheck.error }

  // Verify ownership
  const { data: existing } = await supabase.from('donation_buttons').select('profile_id').eq('id', id).single()
  if (!existing || existing.profile_id !== user.id) return { error: 'No tienes permiso.' }

  if (isFeatured) {
    await supabase.from('donation_buttons').update({ is_featured: false }).eq('profile_id', user.id).neq('id', id)
  }

  const { error } = await supabase.from('donation_buttons')
    .update({
      title, emoji, description, amount,
      hotmart_checkout_url: urlCheck.normalizedUrl ?? hotmartUrl,
      button_label: buttonLabel, is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id).eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/buttons')
  return { success: 'Botón actualizado.' }
}

export async function deleteButtonAction(id: string): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }
  const { error } = await supabase.from('donation_buttons').delete().eq('id', id).eq('profile_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/buttons')
  return { success: 'Botón eliminado.' }
}

export async function toggleButtonAction(id: string, isActive: boolean): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }
  const { error } = await supabase.from('donation_buttons')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id).eq('profile_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/buttons')
  return { success: isActive ? 'Botón activado.' : 'Botón desactivado.' }
}
