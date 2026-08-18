import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const pads = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export function Card({
  className,
  glass = false,
  hover = false,
  padding = 'md',
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        glass ? 'glass' : 'surface',
        'rounded-2xl transition-all duration-200',
        hover && 'hover:shadow-soft-lg hover:-translate-y-0.5',
        pads[padding],
        className
      )}
      {...rest}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  icon?: ReactNode
}

export function CardHeader({ title, description, action, className, icon }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary-2)] [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)] leading-tight">{title}</h3>
          {description && (
            <p className="text-xs text-[var(--text-2)] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('mt-3', className)} {...rest}>
      {children}
    </div>
  )
}
