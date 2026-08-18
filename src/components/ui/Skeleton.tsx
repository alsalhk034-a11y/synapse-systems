import { cn } from '@/lib/utils'

interface Props {
  className?: string
  /** العرض كـ inline block (مثلاً لاسم المريض) */
  inline?: boolean
  /** عدد الأسطر (يولّد مجموعة من الـ skeletons) */
  lines?: number
}

export function Skeleton({ className, inline = false, lines }: Props) {
  if (lines && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton h-3',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    )
  }
  return (
    <span
      className={cn(
        'skeleton block',
        inline ? 'inline-block align-middle' : 'block w-full',
        'h-3',
        className
      )}
    />
  )
}

/** Skeleton مخصص لبطاقات الـ stat الصغيرة */
export function StatCardSkeleton() {
  return (
    <div className="surface p-3">
      <div className="flex items-center gap-2">
        <div className="skeleton h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-2 w-16" />
          <div className="skeleton h-4 w-10" />
        </div>
      </div>
    </div>
  )
}

/** Skeleton لصفوف الجدول */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
      <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-2 w-1/2" />
      </div>
      {Array.from({ length: columns - 2 }).map((_, i) => (
        <div key={i} className="skeleton h-3 w-16" />
      ))}
    </div>
  )
}
