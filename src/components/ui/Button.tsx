import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'btn-primary text-white shadow-sm',
  secondary:
    'bg-[var(--bg-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)]',
  ghost: 'text-[var(--text)] hover:bg-[var(--bg-2)]',
  outline:
    'border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--bg-2)] hover:border-[var(--primary-2)]',
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 shadow-sm',
  subtle:
    'bg-[var(--primary)]/10 text-[var(--primary-2)] hover:bg-[var(--primary)]/15 border border-[var(--primary)]/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[0.95rem] gap-2',
  icon: 'h-9 w-9 p-0',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:ring-2 focus-visible:ring-[var(--primary-2)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]',
          variants[variant],
          sizes[size],
          className
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'
