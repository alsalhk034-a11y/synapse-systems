import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'primary' | 'success' | 'warning'
}

const toneStyles = {
  default: {
    bg: 'from-slate-500/5 to-slate-500/0',
    iconBg: 'from-slate-500/10 to-slate-500/5',
    iconColor: 'text-slate-500',
  },
  primary: {
    bg: 'from-blue-500/5 via-violet-500/5 to-blue-500/0',
    iconBg: 'from-blue-500/15 to-violet-500/10',
    iconColor: 'text-blue-500',
  },
  success: {
    bg: 'from-emerald-500/5 to-emerald-500/0',
    iconBg: 'from-emerald-500/15 to-teal-500/10',
    iconColor: 'text-emerald-500',
  },
  warning: {
    bg: 'from-amber-500/5 to-amber-500/0',
    iconBg: 'from-amber-500/15 to-orange-500/10',
    iconColor: 'text-amber-500',
  },
}

const sizeStyles = {
  sm: {
    container: 'p-6',
    iconWrap: 'h-10 w-10',
    icon: '[&_svg]:h-4 [&_svg]:w-4',
    title: 'text-xs',
    desc: 'text-[11px]',
  },
  md: {
    container: 'p-10',
    iconWrap: 'h-14 w-14',
    icon: '[&_svg]:h-6 [&_svg]:w-6',
    title: 'text-sm',
    desc: 'text-xs',
  },
  lg: {
    container: 'p-14',
    iconWrap: 'h-20 w-20',
    icon: '[&_svg]:h-9 [&_svg]:w-9',
    title: 'text-base',
    desc: 'text-sm',
  },
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  size = 'md',
  tone = 'primary',
}: Props) {
  const tone_ = toneStyles[tone]
  const size_ = sizeStyles[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-[var(--border)] bg-gradient-to-br text-center',
        tone_.bg,
        size_.container,
        className
      )}
    >
      {/* Decorative bg blob */}
      <div className="pointer-events-none absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />

      {size === 'lg' ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className={cn(
            'relative grid place-items-center rounded-2xl bg-gradient-to-br shadow-soft',
            size_.iconWrap,
            tone_.iconBg
          )}
        >
          <div className={cn(tone_.iconColor, size_.icon)}>
            {icon ?? <Inbox />}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
        </motion.div>
      ) : (
        <div
          className={cn(
            'grid place-items-center rounded-xl bg-gradient-to-br',
            size_.iconWrap,
            tone_.iconBg
          )}
        >
          <div className={cn(tone_.iconColor, size_.icon)}>
            {icon ?? <Inbox />}
          </div>
        </div>
      )}

      <div>
        <h3 className={cn('font-semibold text-[var(--text)]', size_.title)}>{title}</h3>
        {description && (
          <p className={cn('mt-1 max-w-md text-[var(--text-2)]', size_.desc)}>{description}</p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  )
}
