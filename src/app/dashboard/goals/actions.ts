'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateHotmartUrl } from '@/lib/validations/url'
import { validateHotmartOfferCode } from '@/lib/validations/hotmart'
import {
  MAX_SUPPORT_AMOUNTS_PER_GOAL,
  PLAN_LIMITS,
  type PlanType,
} from '@/types/database.types'
import {
  moveOrderedItem,
  type MoveDirection,
} from '@/lib/support-goals'

export interface ActionResult {
  error?: string
  success?: string
}

const ALLOWED_COVER_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { user, supabase }
}

function revalidateGoals(goalId?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/goals')
  if (goalId) revalidatePath(`/dashboard/goals/${goalId}`)
  revalidatePath('/[username]', 'page')
}

function parseGoalForm(formData: FormData) {
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const emoji = (formData.get('emoji') as string | null)?.trim() || null
  const description =
    (formData.get('description') as string | null)?.trim() || null
  const isActive = formData.get('isActive') === 'true'

  if (!title) return { error: 'El título es obligatorio.' } as const
  if (title.length > 80)
    return { error: 'El título no puede superar 80 caracteres.' } as const
  if (emoji && emoji.length > 32)
    return { error: 'El emoji es demasiado largo.' } as const
  if (description && description.length > 160)
    return {
      error: 'La descripción no puede superar 160 caracteres.',
    } as const

  return { title, emoji, description, isActive } as const
}

function getCoverFile(formData: FormData) {
  const value = formData.get('cover')
  return value instanceof File && value.size > 0 ? value : null
}

function validateCoverFile(file: File | null) {
  if (!file) return null
  if (!ALLOWED_COVER_TYPES.has(file.type.toLowerCase()))
    return 'La portada debe ser JPG, PNG o WebP.'
  if (file.size > 5 * 1024 * 1024)
    return 'La portada no puede superar 5 MB.'
  return null
}

async function uploadGoalCover(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  goalId: string,
  file: File
) {
  const path = `${userId}/${goalId}`
  const { error } = await supabase.storage
    .from('support-goals')
    .upload(path, file, {
      upsert: true,
      contentType: file.type.toLowerCase(),
    })

  if (error) return { error: error.message, url: null }

  const { data } = supabase.storage.from('support-goals').getPublicUrl(path)
  return { error: null, url: `${data.publicUrl}?t=${Date.now()}` }
}

async function getGoalLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()
  const plan = (profile?.plan as PlanType) ?? 'free'
  return { plan, limit: PLAN_LIMITS[plan].goals }
}

export async function createSupportGoalAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const parsed = parseGoalForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  const cover = getCoverFile(formData)
  const coverError = validateCoverFile(cover)
  if (coverError) return { error: coverError }

  const { plan, limit } = await getGoalLimit(supabase, user.id)
  const { count } = await supabase
    .from('support_goals')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  if ((count ?? 0) >= limit) {
    return {
      error: `Tu plan ${plan} permite un máximo de ${limit} objetivos.`,
    }
  }

  const { data: last } = await supabase
    .from('support_goals')
    .select('order_index')
    .eq('profile_id', user.id)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const id = crypto.randomUUID()
  let coverUrl: string | null = null
  if (cover) {
    const uploaded = await uploadGoalCover(supabase, user.id, id, cover)
    if (uploaded.error) return { error: uploaded.error }
    coverUrl = uploaded.url
  }

  const { error } = await supabase.from('support_goals').insert({
    id,
    profile_id: user.id,
    emoji: parsed.emoji,
    title: parsed.title,
    description: parsed.description,
    cover_url: coverUrl,
    is_active: parsed.isActive,
    order_index: (last?.order_index ?? -1) + 1,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    if (cover) {
      await supabase.storage.from('support-goals').remove([`${user.id}/${id}`])
    }
    return { error: error.message }
  }

  revalidateGoals(id)
  return { success: 'Objetivo creado.' }
}

export async function updateSupportGoalAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  if (!id) return { error: 'Objetivo inválido.' }

  const parsed = parseGoalForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  const cover = getCoverFile(formData)
  const coverError = validateCoverFile(cover)
  if (coverError) return { error: coverError }

  const { data: existing } = await supabase
    .from('support_goals')
    .select('id, cover_url')
    .eq('id', id)
    .eq('profile_id', user.id)
    .single()

  if (!existing) return { error: 'No tienes permiso para editar este objetivo.' }

  let coverUrl = existing.cover_url
  if (cover) {
    const uploaded = await uploadGoalCover(supabase, user.id, id, cover)
    if (uploaded.error) return { error: uploaded.error }
    coverUrl = uploaded.url
  } else if (formData.get('removeCover') === 'true') {
    await supabase.storage.from('support-goals').remove([`${user.id}/${id}`])
    coverUrl = null
  }

  const { error } = await supabase
    .from('support_goals')
    .update({
      emoji: parsed.emoji,
      title: parsed.title,
      description: parsed.description,
      cover_url: coverUrl,
      is_active: parsed.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidateGoals(id)
  return { success: 'Objetivo actualizado.' }
}

export async function toggleSupportGoalAction(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const { error } = await supabase
    .from('support_goals')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  revalidateGoals(id)
  return { success: isActive ? 'Objetivo activado.' : 'Objetivo desactivado.' }
}

export async function deleteSupportGoalAction(
  id: string
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const { error } = await supabase
    .from('support_goals')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) return { error: error.message }
  await supabase.storage.from('support-goals').remove([`${user.id}/${id}`])
  revalidateGoals()
  return { success: 'Objetivo eliminado.' }
}

export async function duplicateSupportGoalAction(
  id: string
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const { plan, limit } = await getGoalLimit(supabase, user.id)
  const [{ data: source }, { count }, { data: last }] = await Promise.all([
    supabase
      .from('support_goals')
      .select('*, support_amounts(*)')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single(),
    supabase
      .from('support_goals')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id),
    supabase
      .from('support_goals')
      .select('order_index')
      .eq('profile_id', user.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!source) return { error: 'Objetivo no encontrado.' }
  if ((count ?? 0) >= limit)
    return { error: `Tu plan ${plan} permite un máximo de ${limit} objetivos.` }

  const newId = crypto.randomUUID()
  let coverUrl: string | null = null
  if (source.cover_url) {
    const { error: copyError } = await supabase.storage
      .from('support-goals')
      .copy(`${user.id}/${id}`, `${user.id}/${newId}`)
    if (copyError) return { error: copyError.message }
    const { data } = supabase.storage
      .from('support-goals')
      .getPublicUrl(`${user.id}/${newId}`)
    coverUrl = `${data.publicUrl}?t=${Date.now()}`
  }

  const { error: goalError } = await supabase.from('support_goals').insert({
    id: newId,
    profile_id: user.id,
    emoji: source.emoji,
    title: `${source.title} (copia)`.slice(0, 80),
    description: source.description,
    cover_url: coverUrl,
    is_active: false,
    order_index: (last?.order_index ?? -1) + 1,
    updated_at: new Date().toISOString(),
  })

  if (goalError) {
    if (coverUrl) {
      await supabase.storage
        .from('support-goals')
        .remove([`${user.id}/${newId}`])
    }
    return { error: goalError.message }
  }

  const sourceAmounts = [...(source.support_amounts ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )
  if (sourceAmounts.length > 0) {
    const { error: amountsError } = await supabase
      .from('support_amounts')
      .insert(
        sourceAmounts.map((amount, orderIndex) => ({
          goal_id: newId,
          amount: amount.amount,
          currency: amount.currency,
          hotmart_checkout_url: amount.hotmart_checkout_url,
          hotmart_offer_code: amount.hotmart_offer_code,
          button_label: amount.button_label,
          is_featured: amount.is_featured,
          order_index: orderIndex,
          updated_at: new Date().toISOString(),
        }))
      )

    if (amountsError) {
      await supabase
        .from('support_goals')
        .delete()
        .eq('id', newId)
        .eq('profile_id', user.id)
      if (coverUrl) {
        await supabase.storage
          .from('support-goals')
          .remove([`${user.id}/${newId}`])
      }
      return { error: amountsError.message }
    }
  }

  revalidateGoals(newId)
  return { success: 'Objetivo duplicado como borrador.' }
}

export async function moveSupportGoalAction(
  id: string,
  direction: MoveDirection
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }
  if (direction !== 'up' && direction !== 'down')
    return { error: 'Movimiento inválido.' }

  const { data, error: loadError } = await supabase
    .from('support_goals')
    .select('id, order_index')
    .eq('profile_id', user.id)
    .order('order_index')
  if (loadError) return { error: loadError.message }

  const original = data ?? []
  const reordered = moveOrderedItem(original, id, direction)
  if (reordered === original) return { success: 'El orden no cambió.' }

  const previous = new Map(original.map((item) => [item.id, item.order_index]))
  const results = await Promise.all(
    reordered
      .filter((item) => previous.get(item.id) !== item.order_index)
      .map((item) =>
        supabase
          .from('support_goals')
          .update({
            order_index: item.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
          .eq('profile_id', user.id)
      )
  )
  const updateError = results.find((result) => result.error)?.error
  if (updateError) return { error: updateError.message }

  revalidateGoals()
  return { success: 'Orden actualizado.' }
}

function parseAmountForm(formData: FormData) {
  const amountRaw = (formData.get('amount') as string | null)?.trim() ?? ''
  const currency =
    (formData.get('currency') as string | null)?.trim().toUpperCase() ?? ''
  const hotmartUrl =
    (formData.get('hotmartUrl') as string | null)?.trim() ?? ''
  const hotmartOfferCode =
    (formData.get('hotmartOfferCode') as string | null)?.trim() ?? ''
  const buttonLabel =
    (formData.get('buttonLabel') as string | null)?.trim() || null
  const isFeatured = formData.get('isFeatured') === 'true'

  if (!/^\d+(\.\d{1,2})?$/.test(amountRaw))
    return { error: 'El monto debe ser positivo y tener máximo 2 decimales.' } as const
  const amount = Number(amountRaw)
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: 'El monto debe ser mayor a cero.' } as const
  if (!/^[A-Z]{3}$/.test(currency))
    return { error: 'La moneda debe tener un código ISO de 3 letras.' } as const
  if (buttonLabel && buttonLabel.length > 40)
    return { error: 'El texto del CTA no puede superar 40 caracteres.' } as const

  const urlResult = validateHotmartUrl(hotmartUrl)
  if (!urlResult.ok) return { error: urlResult.error } as const
  const offerCodeResult = validateHotmartOfferCode(hotmartOfferCode)
  if (!offerCodeResult.ok) return { error: offerCodeResult.error } as const

  return {
    amount,
    currency,
    hotmartUrl: urlResult.normalizedUrl ?? hotmartUrl,
    hotmartOfferCode: offerCodeResult.normalizedCode ?? null,
    buttonLabel,
    isFeatured,
  } as const
}

async function ownedGoal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  goalId: string
) {
  const { data } = await supabase
    .from('support_goals')
    .select('id')
    .eq('id', goalId)
    .eq('profile_id', userId)
    .single()
  return data
}

export async function createSupportAmountAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const goalId = (formData.get('goalId') as string | null)?.trim() ?? ''
  if (!(await ownedGoal(supabase, user.id, goalId)))
    return { error: 'Objetivo no encontrado.' }

  const parsed = parseAmountForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  const { count } = await supabase
    .from('support_amounts')
    .select('id', { count: 'exact', head: true })
    .eq('goal_id', goalId)
  if ((count ?? 0) >= MAX_SUPPORT_AMOUNTS_PER_GOAL) {
    return {
      error: `Cada objetivo admite hasta ${MAX_SUPPORT_AMOUNTS_PER_GOAL} niveles.`,
    }
  }

  if (parsed.isFeatured) {
    const { error } = await supabase
      .from('support_amounts')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .eq('goal_id', goalId)
    if (error) return { error: error.message }
  }

  const { data: last } = await supabase
    .from('support_amounts')
    .select('order_index')
    .eq('goal_id', goalId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('support_amounts').insert({
    goal_id: goalId,
    amount: parsed.amount,
    currency: parsed.currency,
    hotmart_checkout_url: parsed.hotmartUrl,
    hotmart_offer_code: parsed.hotmartOfferCode,
    button_label: parsed.buttonLabel,
    is_featured: parsed.isFeatured,
    order_index: (last?.order_index ?? -1) + 1,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }
  revalidateGoals(goalId)
  return { success: 'Nivel agregado.' }
}

export async function updateSupportAmountAction(
  formData: FormData
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const id = (formData.get('id') as string | null)?.trim() ?? ''
  const { data: existing } = await supabase
    .from('support_amounts')
    .select('id, goal_id')
    .eq('id', id)
    .single()
  if (!existing || !(await ownedGoal(supabase, user.id, existing.goal_id)))
    return { error: 'Nivel no encontrado.' }

  const parsed = parseAmountForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  if (parsed.isFeatured) {
    const { error } = await supabase
      .from('support_amounts')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .eq('goal_id', existing.goal_id)
      .neq('id', id)
    if (error) return { error: error.message }
  }

  const { error } = await supabase
    .from('support_amounts')
    .update({
      amount: parsed.amount,
      currency: parsed.currency,
      hotmart_checkout_url: parsed.hotmartUrl,
      hotmart_offer_code: parsed.hotmartOfferCode,
      button_label: parsed.buttonLabel,
      is_featured: parsed.isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('goal_id', existing.goal_id)

  if (error) return { error: error.message }
  revalidateGoals(existing.goal_id)
  return { success: 'Nivel actualizado.' }
}

export async function deleteSupportAmountAction(
  id: string
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }

  const { data: existing } = await supabase
    .from('support_amounts')
    .select('id, goal_id')
    .eq('id', id)
    .single()
  if (!existing || !(await ownedGoal(supabase, user.id, existing.goal_id)))
    return { error: 'Nivel no encontrado.' }

  const { error } = await supabase
    .from('support_amounts')
    .delete()
    .eq('id', id)
    .eq('goal_id', existing.goal_id)
  if (error) return { error: error.message }

  revalidateGoals(existing.goal_id)
  return { success: 'Nivel eliminado.' }
}

export async function moveSupportAmountAction(
  id: string,
  direction: MoveDirection
): Promise<ActionResult> {
  const { user, supabase } = await getUser()
  if (!user) return { error: 'No estás autenticado.' }
  if (direction !== 'up' && direction !== 'down')
    return { error: 'Movimiento inválido.' }

  const { data: current } = await supabase
    .from('support_amounts')
    .select('id, goal_id')
    .eq('id', id)
    .single()
  if (!current || !(await ownedGoal(supabase, user.id, current.goal_id)))
    return { error: 'Nivel no encontrado.' }

  const { data, error: loadError } = await supabase
    .from('support_amounts')
    .select('id, order_index')
    .eq('goal_id', current.goal_id)
    .order('order_index')
  if (loadError) return { error: loadError.message }

  const original = data ?? []
  const reordered = moveOrderedItem(original, id, direction)
  if (reordered === original) return { success: 'El orden no cambió.' }

  const previous = new Map(original.map((item) => [item.id, item.order_index]))
  const results = await Promise.all(
    reordered
      .filter((item) => previous.get(item.id) !== item.order_index)
      .map((item) =>
        supabase
          .from('support_amounts')
          .update({
            order_index: item.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
          .eq('goal_id', current.goal_id)
      )
  )
  const updateError = results.find((result) => result.error)?.error
  if (updateError) return { error: updateError.message }

  revalidateGoals(current.goal_id)
  return { success: 'Orden actualizado.' }
}
