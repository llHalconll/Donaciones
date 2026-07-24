'use server'

import { createClient } from '@/lib/supabase/server'

interface ActionResult { error?: string; success?: string }

export async function updatePasswordAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const newPassword = (formData.get('newPassword') as string | null)?.trim() ?? ''
  const confirm = (formData.get('confirmPassword') as string | null)?.trim() ?? ''

  if (!newPassword) return { error: 'La nueva contraseña es obligatoria.' }
  if (newPassword.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (newPassword !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: 'Contraseña actualizada correctamente.' }
}
