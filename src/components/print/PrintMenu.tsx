import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, ChevronDown, Pill, FileText, FlaskConical, FileCheck2, Eye, ScanLine } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

export type PrintType = 'prescription' | 'summary' | 'lab' | 'sickleave' | 'xray'

interface Props {
  onPrint: (type: PrintType) => void
  onPreview?: (type: PrintType) => void
  disabled?: boolean
  className?: string
}

export function PrintMenu({ onPrint, onPreview, disabled, className }: Props) {
  const { t, lang } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handle)
      return () => document.removeEventListener('mousedown', handle)
    }
  }, [open])

  const options: Array<{ type: PrintType; icon: any; label: string; labelEn: string; color: string }> = [
    { type: 'prescription', icon: Pill, label: 'وصفة طبية', labelEn: 'Prescription', color: 'text-blue-500' },
    { type: 'summary', icon: FileText, label: 'ملخص الزيارة', labelEn: 'Visit Summary', color: 'text-violet-500' },
    { type: 'lab', icon: FlaskConical, label: 'طلب تحاليل', labelEn: 'Lab Request', color: 'text-emerald-500' },
    { type: 'xray', icon: ScanLine, label: 'طلب تصوير أشعة', labelEn: 'Imaging Request', color: 'text-rose-500' },
    { type: 'sickleave', icon: FileCheck2, label: 'شهادة / إجازة مرضية', labelEn: 'Sick Leave', color: 'text-amber-500' },
  ]

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[var(--bg-2)] disabled:opacity-50'
        )}
      >
        <Printer className="h-4 w-4" />
        {t.print}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute end-0 top-full z-30 mt-1.5 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="border-b border-[var(--border)] p-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {lang === 'ar' ? 'اختر نوع المطبوع' : 'Choose print type'}
            </div>
            <div className="p-1">
              {options.map((opt) => {
                const Icon = opt.icon
                return (
                  <div key={opt.type} className="group flex items-center gap-2 rounded-md p-1">
                    <button
                      onClick={() => { onPrint(opt.type); setOpen(false) }}
                      className="flex flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-start transition-colors hover:bg-[var(--bg-2)]"
                    >
                      <div className={cn('grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10', opt.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 text-xs font-semibold">{lang === 'ar' ? opt.label : opt.labelEn}</div>
                    </button>
                    {onPreview && (
                      <button
                        onClick={() => { onPreview(opt.type); setOpen(false) }}
                        className="rounded-md p-1.5 text-[var(--text-3)] opacity-0 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--text)] group-hover:opacity-100"
                        title={lang === 'ar' ? 'معاينة' : 'Preview'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
