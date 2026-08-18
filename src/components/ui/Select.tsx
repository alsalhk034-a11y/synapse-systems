import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  leftIcon?: ReactNode
  error?: string
  options?: { value: string; label: string }[]
}

/**
 * مكون Select - قائمة منسدلة متناسقة مع تصميم المنصة
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, leftIcon, error, options, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
            {leftIcon}
          </span>
        )}
        <select
          ref={ref}
          className={cn(
            'h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] transition-colors',
            'focus:border-[var(--primary-2)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-2)]/20',
            'disabled:opacity-50',
            leftIcon && 'ps-9',
            error && 'border-rose-500',
            className
          )}
          {...props}
        >
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <div className="mt-1 text-[10px] text-rose-500">{error}</div>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
