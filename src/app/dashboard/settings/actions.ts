'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  // Prevent trivially weak passwords
  if (/^(.+?)\1+$/.test(newPassword)) return { error: 'La contraseña es demasiado simple. Usa una más segura.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: 'Contraseña actualizada correctamente.' }
}

export async function updateEmailAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const newEmail = (formData.get('newEmail') as string | null)?.trim().toLowerCase() ?? ''
  const confirmEmail = (formData.get('confirmEmail') as string | null)?.trim().toLowerCase() ?? ''

  if (!newEmail) return { error: 'El correo es obligatorio.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return { error: 'Ingresa un correo electrónico válido.' }
  if (newEmail !== confirmEmail) return { error: 'Los correos no coinciden.' }

  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado.' }
  if (user.email === newEmail) return { error: 'El correo nuevo es igual al actual.' }

  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) return { error: error.message }

  return {
    success:
      'Solicitud enviada. Revisa tu bandeja de entrada en ambos correos para confirmar el cambio.',
  }
}

export async function deleteAccountAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const confirmation = (formData.get('confirmation') as string | null)?.trim() ?? ''

  if (confirmation !== 'ELIMINAR') {
    return { error: 'Debes escribir ELIMINAR para confirmar.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado.' }

  // Deactivate the profile first (soft approach — hard delete requires service_role)
  // This immediately hides the profile from the public.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // Sign out the user
  await supabase.auth.signOut()

  redirect('/?account_deleted=1')
}
