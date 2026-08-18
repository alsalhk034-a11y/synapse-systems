import { cn } from '@/lib/utils'

interface Props {
  value: number // 0..1
  className?: string
  showLabel?: boolean
}

export function Progress({ value, className, showLabel }: Props) {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className={cn('w-full', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-2)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
          style={{ width: `${v * 100}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-[11px] text-[var(--text-3)]">{Math.round(v * 100)}%</div>
      )}
    </div>
  )
}
