import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FlaskConical, Plus, Trash2, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/stores/toastStore'

const COMMON_TESTS = [
  'CBC - صورة دم كاملة',
  'CRP - بروتين سي التفاعلي',
  'ESR - سرعة ترسب الدم',
  'Blood Glucose - سكر الدم',
  'HbA1c - السكر التراكمي',
  'Liver Function - وظائف الكبد',
  'Kidney Function - وظائف الكلى',
  'Thyroid Function - وظائف الغدة الدرقية',
  'Urinalysis - تحليل بول',
  'Stool Analysis - تحليل براز',
  'Throat Swab - مسحة حلق',
  'Blood Culture - زراعة دم',
  'Electrolytes - أملاح',
  'Vitamin D - فيتامين د',
  'Iron - الحديد',
  'Ferritin - فيريتين',
]

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (tests: string[], notes: string) => void
}

export function LabRequestModal({ open, onClose, onConfirm }: Props) {
  const { lang } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const [customTest, setCustomTest] = useState('')
  const [notes, setNotes] = useState('')

  const toggleTest = (test: string) => {
    setSelected((s) =>
      s.includes(test) ? s.filter((t) => t !== test) : [...s, test]
    )
  }

  const addCustom = () => {
    if (!customTest.trim()) return
    if (!selected.includes(customTest.trim())) {
      setSelected((s) => [...s, customTest.trim()])
    }
    setCustomTest('')
  }

  const handleConfirm = () => {
    if (selected.length === 0) {
      toast.error(
        lang === 'ar' ? 'اختر تحاليل أولاً' : 'Select at least one test'
      )
      return
    }
    onConfirm(selected, notes)
    setSelected([])
    setNotes('')
    setCustomTest('')
  }

  const handleClose = () => {
    setSelected([])
    setNotes('')
    setCustomTest('')
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
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <FlaskConical className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {lang === 'ar' ? 'طلب تحاليل مخبرية' : 'Lab request'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-3)]">
                    {lang === 'ar'
                      ? 'اختر التحاليل المطلوبة'
                      : 'Select required tests'}
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

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'تحاليل شائعة' : 'Common tests'} ({selected.length})
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {COMMON_TESTS.map((test) => {
                    const isSelected = selected.includes(test)
                    return (
                      <button
                        key={test}
                        onClick={() => toggleTest(test)}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-start text-xs transition-all ${
                          isSelected
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-2)]/40'
                        }`}
                      >
                        <div
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded border-2 transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-[var(--border-strong)]'
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <span className="font-medium">{test}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'إضافة تحليل مخصص' : 'Add custom test'}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customTest}
                    onChange={(e) => setCustomTest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                    placeholder={lang === 'ar' ? 'اسم التحليل' : 'Test name'}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addCustom}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    {lang === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </div>

              {selected.filter((s) => !COMMON_TESTS.includes(s)).length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {lang === 'ar' ? 'تحاليل مخصصة' : 'Custom tests'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected
                      .filter((s) => !COMMON_TESTS.includes(s))
                      .map((test) => (
                        <span
                          key={test}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          {test}
                          <button
                            onClick={() => toggleTest(test)}
                            className="hover:text-emerald-900"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'ملاحظات' : 'Notes'}
                </div>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
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
