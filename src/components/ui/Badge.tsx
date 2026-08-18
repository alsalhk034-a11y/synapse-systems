import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'subtle'

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--bg-2)] text-[var(--text-2)] border-[var(--border)]',
  primary: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  success: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  subtle: 'bg-[var(--primary)]/10 text-[var(--primary-2)] border-[var(--primary)]/20',
}

interface Props {
  children: React.ReactNode
  tone?: Tone
  className?: string
  icon?: React.ReactNode
}

export function Badge({ children, tone = 'neutral', className, icon }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5',
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
