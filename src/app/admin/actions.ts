'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ActionResult { error?: string; success?: string }

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, supabase }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { admin: null, supabase }
  return { admin: user, supabase }
}

export async function toggleProfileActiveAction(
  profileId: string,
  currentIsActive: boolean
): Promise<ActionResult> {
  const { admin, supabase } = await getAdminUser()
  if (!admin) return { error: 'Acceso denegado. Se requieren permisos de administrador.' }

  // Admin cannot deactivate their own account
  if (profileId === admin.id) return { error: 'No puedes desactivar tu propia cuenta de administrador.' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: !currentIsActive, updated_at: new Date().toISOString() })
    .eq('id', profileId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/admin/users')
  return { success: `Perfil ${!currentIsActive ? 'activado' : 'desactivado'} correctamente.` }
}

export async function updateReportStatusAction(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed'
): Promise<ActionResult> {
  const { admin, supabase } = await getAdminUser()
  if (!admin) return { error: 'Acceso denegado.' }

  const VALID = new Set(['reviewed', 'resolved', 'dismissed'])
  if (!VALID.has(status)) return { error: 'Estado no válido.' }

  const { error } = await supabase
    .from('profile_reports')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq('id', reportId)

  if (error) return { error: error.message }

  revalidatePath('/admin/reports')
  return { success: `Reporte marcado como "${status}".` }
}
