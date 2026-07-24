'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/auth/actions'

export function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      type="button"
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors w-full text-left"
    >
      <LogOut className="w-4 h-4" />
      <span>Cerrar Sesión</span>
    </button>
  )
}
