import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, type Toast, type ToastTone } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

const TONE_STYLES: Record<ToastTone, { ring: string; bg: string; text: string; icon: any }> = {
  success: {
    ring: 'ring-emerald-500/30',
    bg: 'from-emerald-500/15 to-teal-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  error: {
    ring: 'ring-rose-500/30',
    bg: 'from-rose-500/15 to-red-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    icon: AlertCircle,
  },
  info: {
    ring: 'ring-blue-500/30',
    bg: 'from-blue-500/15 to-indigo-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    icon: Info,
  },
  warning: {
    ring: 'ring-amber-500/30',
    bg: 'from-amber-500/15 to-orange-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    icon: AlertTriangle,
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const style = TONE_STYLES[toast.tone]
  const Icon = style.icon
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'pointer-events-auto flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-soft ring-1 backdrop-blur-md',
        style.ring
      )}
    >
      <div
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br',
          style.bg
        )}
      >
        <Icon className={cn('h-4.5 w-4.5', style.text)} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--text)]">{toast.message}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-[var(--text-2)]">{toast.description}</div>
        )}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--text-3)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
        aria-label="dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
