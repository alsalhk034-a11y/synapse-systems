import { create } from 'zustand'
import { generateId } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Info, CheckCircle2, Trash2 } from 'lucide-react'
import { useEffect } from 'react'

export type ConfirmTone = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  tone?: ConfirmTone
}

interface ConfirmItem {
  id: string
  options: ConfirmOptions
  resolve: (ok: boolean) => void
}

interface ConfirmState {
  items: ConfirmItem[]
  ask: (options: ConfirmOptions) => Promise<boolean>
  remove: (id: string, ok: boolean) => void
}

const useStore = create<ConfirmState>((set, get) => ({
  items: [],
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      const id = generateId('cf')
      set((s) => ({ items: [...s.items, { id, options, resolve }] }))
    }),
  remove: (id, ok) => {
    const item = get().items.find((i) => i.id === id)
    if (item) {
      item.resolve(ok)
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    }
  },
}))

/**
 * Hook لإظهار confirmation dialog كـ Promise.
 * الاستخدام: const ok = await confirm({ title: '...', tone: 'danger' })
 */
export function useConfirm() {
  const ask = useStore((s) => s.ask)
  return ask
}

const TONE_STYLES: Record<ConfirmTone, { icon: any; ring: string; bg: string; text: string }> = {
  danger: {
    icon: Trash2,
    ring: 'ring-rose-500/30',
    bg: 'from-rose-500/15 to-red-500/10',
    text: 'text-rose-600 dark:text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'ring-amber-500/30',
    bg: 'from-amber-500/15 to-orange-500/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    ring: 'ring-blue-500/30',
    bg: 'from-blue-500/15 to-indigo-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    icon: CheckCircle2,
    ring: 'ring-emerald-500/30',
    bg: 'from-emerald-500/15 to-teal-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
}

export function ConfirmContainer() {
  const items = useStore((s) => s.items)
  const remove = useStore((s) => s.remove)
  const top = items[items.length - 1] // نعرض الأحدث فقط لتقليل الـ popups
  return (
    <>
      {top && (
        <ConfirmDialog
          key={top.id}
          options={top.options}
          onClose={(ok) => remove(top.id, ok)}
        />
      )}
    </>
  )
}

function ConfirmDialog({
  options,
  onClose,
}: {
  options: ConfirmOptions
  onClose: (ok: boolean) => void
}) {
  const tone = options.tone ?? 'info'
  const style = TONE_STYLES[tone]
  const Icon = style.icon
  const confirmText = options.confirmText ?? 'تأكيد'
  const cancelText = options.cancelText ?? 'إلغاء'

  return (
    <Modal
      open
      onClose={() => onClose(false)}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose(false)}>
            {cancelText}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => onClose(true)}
            autoFocus
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${style.bg} ring-1 ${style.ring}`}
        >
          <Icon className={`h-5 w-5 ${style.text}`} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[var(--text)]">{options.title}</h3>
          {options.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-2)]">
              {options.description}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
