import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ScanLine, Plus } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (data: { modality: string; region: string; indication: string; notes: string }) => void
  chiefComplaint?: string
}

const MODALITIES = [
  { key: 'xray-plain', ar: 'أشعة بسيطة', en: 'Plain X-ray', icon: '🦴' },
  { key: 'xray-contrast', ar: 'أشعة بالصبغة', en: 'Contrast X-ray', icon: '💉' },
  { key: 'ultrasound', ar: 'إيكو (سونار)', en: 'Ultrasound', icon: '🔊' },
  { key: 'ct', ar: 'طبقي محوري (CT)', en: 'CT Scan', icon: '🌀' },
  { key: 'mri', ar: 'رنين مغناطيسي (MRI)', en: 'MRI', icon: '🧲' },
]

const REGIONS = [
  { key: 'chest', ar: 'صدر', en: 'Chest' },
  { key: 'abdomen', ar: 'بطن', en: 'Abdomen' },
  { key: 'skull', ar: 'جمجمة', en: 'Skull' },
  { key: 'spine', ar: 'عمود فقري', en: 'Spine' },
  { key: 'pelvis', ar: 'حوض', en: 'Pelvis' },
  { key: 'upper-limb', ar: 'طرف علوي', en: 'Upper limb' },
  { key: 'lower-limb', ar: 'طرف سفلي', en: 'Lower limb' },
  { key: 'neck', ar: 'رقبة', en: 'Neck' },
  { key: 'sinuses', ar: 'جيوب أنفية', en: 'Paranasal sinuses' },
  { key: 'other', ar: 'أخرى', en: 'Other' },
]

export function XRayRequestModal({ open, onClose, onConfirm, chiefComplaint }: Props) {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const [modality, setModality] = useState('xray-plain')
  const [region, setRegion] = useState('chest')
  const [indication, setIndication] = useState(chiefComplaint || '')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    const mod = MODALITIES.find((m) => m.key === modality)!
    const reg = REGIONS.find((r) => r.key === region)!
    onConfirm({
      modality: isAr ? mod.ar : mod.en,
      region: isAr ? reg.ar : reg.en,
      indication,
      notes,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                  <ScanLine className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">{isAr ? 'طلب تصوير أشعة' : 'Imaging Request'}</h2>
                  <p className="text-xs text-[var(--text-3)]">
                    {isAr ? 'حدد نوع التصوير والمنطقة المراد تصويرها' : 'Choose imaging type and region'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-[var(--bg-2)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
              {/* Modality */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {isAr ? 'نوع التصوير' : 'Modality'}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MODALITIES.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setModality(m.key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all',
                        modality === m.key
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                          : 'border-[var(--border)] hover:border-[var(--text-3)]'
                      )}
                    >
                      <div className="text-2xl">{m.icon}</div>
                      <div className="text-[11px] font-semibold">{isAr ? m.ar : m.en}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {isAr ? 'المنطقة' : 'Region'}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {REGIONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRegion(r.key)}
                      className={cn(
                        'rounded-lg border-2 p-2 text-[11px] font-semibold transition-all',
                        region === r.key
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                          : 'border-[var(--border)] hover:border-[var(--text-3)]'
                      )}
                    >
                      {isAr ? r.ar : r.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Indication */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {isAr ? 'الاستطباب السريري' : 'Clinical Indication'}
                </label>
                <textarea
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5 text-sm focus:border-rose-500 focus:outline-none"
                  placeholder={isAr ? 'مثلاً: اشتباه التهاب رئوي، كسر مشتبه...' : 'e.g. Suspected pneumonia, suspected fracture...'}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {isAr ? 'ملاحظات إضافية' : 'Additional Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-2.5 text-sm focus:border-rose-500 focus:outline-none"
                  placeholder={isAr ? 'مقارنات، أوضاع خاصة...' : 'Comparisons, special views...'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] p-4">
              <Button variant="secondary" size="sm" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                {isAr ? 'تأكيد الطلب' : 'Confirm Request'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
