import { AnimatePresence, motion } from 'framer-motion'
import { X, Printer, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { printElement } from '@/lib/printService'
import { useSettingsStore } from '@/stores/settingsStore'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  onPrint?: () => void
  paperSize?: 'A4' | 'A5'
  className?: string
}

/**
 * نافذة معاينة الطباعة - الحل المحدث:
 * - تعرض معاينة داخل النافذة
 * - عند الطباعة تستخدم iframe معزول يطبع المحتوى فقط (لا الصفحة كاملة)
 */
export function PrintPreviewModal({
  open,
  onClose,
  title,
  description,
  children,
  onPrint,
  paperSize = 'A4',
  className,
}: Props) {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const [zoom, setZoom] = useState(1)
  const [isPrinting, setIsPrinting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const clinic = useSettingsStore((s) => s.clinic)

  useEffect(() => {
    if (!open) {
      setZoom(1)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
      return
    }
    if (!contentRef.current) return
    setIsPrinting(true)
    try {
      printElement(contentRef.current, {
        documentTitle: title || 'Document',
        paperSize: clinic?.print?.paperSize || paperSize,
        margins: clinic?.print?.margins || 'normal',
        fontSize: clinic?.print?.fontSize || 'md',
        primaryColor: clinic?.print?.primaryColor,
        language: clinic?.print?.language || (isAr ? 'ar' : 'en'),
        direction: isAr ? 'rtl' : 'ltr',
      })
    } catch (e) {
      console.error('Print error', e)
    } finally {
      setTimeout(() => setIsPrinting(false), 600)
    }
  }

  const paperWidth = paperSize === 'A5' ? '420px' : '720px'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex items-center justify-between gap-3 border-b border-white/10 bg-[var(--surface)] px-5 py-3 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-glow">
                <Printer className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold">
                  {title || (isAr ? 'معاينة الطباعة' : 'Print preview')}
                </h2>
                {description && (
                  <p className="text-[11px] text-[var(--text-3)]">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-0.5">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="rounded-md p-1.5 text-[var(--text-2)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  title={isAr ? 'تصغير' : 'Zoom out'}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <div className="px-2 text-[11px] font-semibold tabular-nums text-[var(--text-2)]">
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                  className="rounded-md p-1.5 text-[var(--text-2)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  title={isAr ? 'تكبير' : 'Zoom in'}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                loading={isPrinting}
                leftIcon={<Printer className="h-3.5 w-3.5" />}
              >
                {isAr ? 'طباعة الفاتورة فقط' : 'Print document only'}
              </Button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          <div
            className="flex-1 overflow-auto bg-slate-200/50 p-6 dark:bg-slate-900/50"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className={cn('mx-auto origin-top', className)}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                maxWidth: paperWidth,
              }}
            >
              <div ref={contentRef} className="bg-white text-slate-900 shadow-2xl print-preview-content">
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
