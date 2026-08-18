import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileCheck2, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { toast } from '@/stores/toastStore'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (data: { days: number; startDate: string; endDate: string; reason: string }) => void
}

export function SickLeaveModal({ open, onClose, onConfirm }: Props) {
  const { lang } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const [days, setDays] = useState(3)
  const [startDate, setStartDate] = useState(today)
  const [reason, setReason] = useState('')

  const endDate = (() => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + days - 1)
    return d.toISOString().split('T')[0]
  })()

  const handleConfirm = () => {
    if (days < 1) {
      toast.error(lang === 'ar' ? 'عدد الأيام غير صحيح' : 'Invalid number of days')
      return
    }
    if (!startDate) {
      toast.error(lang === 'ar' ? 'حدد تاريخ البداية' : 'Select start date')
      return
    }
    onConfirm({ days, startDate, endDate, reason })
  }

  const handleClose = () => {
    setDays(3)
    setStartDate(today)
    setReason('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {lang === 'ar' ? 'إجازة مرضية' : 'Sick Leave'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-3)]">
                    {lang === 'ar'
                      ? 'أدخل بيانات الشهادة'
                      : 'Enter certificate details'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {lang === 'ar' ? 'عدد الأيام' : 'Number of days'}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {lang === 'ar' ? 'من تاريخ' : 'Start date'}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)]/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-2)]">
                    {lang === 'ar' ? 'إلى تاريخ' : 'End date'}
                  </span>
                  <span className="font-semibold">
                    {new Date(endDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[var(--text-2)]">
                    {lang === 'ar' ? 'المدة' : 'Duration'}
                  </span>
                  <span className="font-bold text-amber-600">
                    {days} {lang === 'ar' ? 'يوم' : 'days'}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'السبب' : 'Reason'}
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder={lang === 'ar' ? 'مثال: التهاب حاد في الحلق' : 'e.g. Acute pharyngitis'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--bg-2)]/50 p-3">
              <Button variant="ghost" onClick={handleClose}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                leftIcon={<Check className="h-4 w-4" />}
              >
                {lang === 'ar' ? 'متابعة للمعاينة' : 'Continue to preview'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
