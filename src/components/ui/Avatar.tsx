import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn, initials, pickColor } from '@/lib/utils'

interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ring?: boolean
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({ name, size = 'md', className, ring = false }: Props) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className={cn(
        'grid place-items-center rounded-full font-semibold text-white shadow-soft',
        `bg-gradient-to-br ${pickColor(name)}`,
        sizes[size],
        ring && 'ring-2 ring-white/20',
        className
      )}
      title={name}
    >
      {initials(name)}
    </motion.div>
  )
}

interface GroupProps {
  names: string[]
  size?: 'xs' | 'sm' | 'md' | 'lg'
  max?: number
  className?: string
}

export function AvatarGroup({ names, size = 'sm', max = 4, className }: GroupProps) {
  const shown = names.slice(0, max)
  const rest = Math.max(0, names.length - max)
  return (
    <div className={cn('flex -space-x-2 rtl:space-x-reverse', className)}>
      {shown.map((n, i) => (
        <Avatar
          key={n + i}
          name={n}
          size={size}
          ring
          className="border-2 border-[var(--bg)]"
        />
      ))}
      {rest > 0 && (
        <div
          className={cn(
            'grid place-items-center rounded-full bg-[var(--bg-2)] text-[var(--text-2)] font-semibold border-2 border-[var(--bg)]',
            sizes[size]
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  )
}

export function PatientBadge({
  name,
  age,
  gender,
  size = 'md',
}: {
  name: string
  age?: ReactNode
  gender?: 'male' | 'female'
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name} size={size === 'sm' ? 'sm' : size === 'lg' ? 'xl' : 'md'} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--text)]">{name}</div>
        {(age || gender) && (
          <div className="text-[11px] text-[var(--text-3)]">
            {age}
            {age && gender ? ' • ' : ''}
            {gender === 'male' ? '♂' : gender === 'female' ? '♀' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
