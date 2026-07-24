import React, { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'indigo' | 'outline' | 'slate'
}

export function Badge({ children, variant = 'emerald', className = '', ...props }: BadgeProps) {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    outline: 'border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
