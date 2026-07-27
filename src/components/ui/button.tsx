import React, { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 dark:focus-visible:ring-offset-slate-950',
  secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 dark:hover:bg-indigo-500 dark:focus-visible:ring-offset-slate-950',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-offset-slate-950',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 dark:focus-visible:ring-offset-slate-950',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 dark:focus-visible:ring-offset-slate-950',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3.5 py-2 text-xs gap-1.5',
  md: 'min-h-11 px-4 py-2.5 text-sm gap-2',
  lg: 'min-h-14 px-6 py-3 text-base gap-2.5',
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  )
}
