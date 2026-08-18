import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, leftIcon, rightIcon, invalid, ...rest }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[var(--text-3)]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'h-10 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-3)]',
            'border-[var(--border)] hover:border-[var(--border-strong)]',
            'focus:border-[var(--primary-2)] focus:ring-2 focus:ring-[var(--primary-2)]/20 focus:outline-none',
            'transition-colors',
            leftIcon && 'ps-9',
            rightIcon && 'pe-9',
            invalid && 'border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[var(--text-3)]">
            {rightIcon}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-[88px] w-full rounded-lg border bg-[var(--surface)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-3)]',
          'border-[var(--border)] hover:border-[var(--border-strong)]',
          'focus:border-[var(--primary-2)] focus:ring-2 focus:ring-[var(--primary-2)]/20 focus:outline-none',
          'transition-colors resize-y',
          invalid && 'border-rose-500 focus:ring-rose-500/20',
          className
        )}
        {...rest}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...rest }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border bg-[var(--surface)] px-3 pe-8 text-sm text-[var(--text)]',
          'border-[var(--border)] hover:border-[var(--border-strong)]',
          'focus:border-[var(--primary-2)] focus:ring-2 focus:ring-[var(--primary-2)]/20 focus:outline-none',
          'transition-colors appearance-none bg-no-repeat bg-[length:16px_16px] bg-[position:calc(100%-12px)_center]',
          invalid && 'border-rose-500 focus:ring-rose-500/20',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3e%3cpath d='M1 1L6 6L11 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round'/%3e%3c/svg%3e\")",
        }}
        {...rest}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'
