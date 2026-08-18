import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  ChevronLeft,
  Thermometer,
  Weight,
  Ruler,
  HeartPulse,
  Wind,
  Droplets,
  Activity,
  FileText,
  Pill,
  Plus,
  Trash2,
  Sparkles,
  Stethoscope,
  BookMarked,
  Check,
  X,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { usePatientsStore } from '@/stores/patientsStore'
import { useExamsStore } from '@/stores/examsStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuditStore } from '@/stores/auditStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Avatar, PatientBadge } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/Motion'
import { Modal } from '@/components/ui/Modal'
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal'
import { PrintMenu, type PrintType } from '@/components/print/PrintMenu'
import { LabRequestModal } from '@/components/print/LabRequestModal'
import { SickLeaveModal } from '@/components/print/SickLeaveModal'
import { PrescriptionPrintable, VisitSummaryPrintable, LabRequestPrintable, SickLeavePrintable, XRayRequestPrintable } from '@/components/print/Printable'
import { XRayRequestModal } from '@/components/print/XRayRequestModal'
import { formatAge, formatDate } from '@/lib/format'
import { generateId } from '@/lib/utils'
import { toast } from '@/stores/toastStore'
import type { Exam, Prescription, VitalSigns, ExamTemplate } from '@/types/exam'
import type { ClinicInfo } from '@/types/user'
import { cn } from '@/lib/utils'

interface VitalField {
  key: keyof VitalSigns
  label: string
  unit: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  type?: 'number' | 'text'
  min?: number
  max?: number
  step?: number
}

export function ExamWorkspacePage() {
  const { patientId, examId } = useParams<{ patientId: string; examId?: string }>()
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const getPatient = usePatientsStore((s) => s.getPatient)
  const touch = usePatientsStore((s) => s.touch)
  const addExam = useExamsStore((s) => s.addExam)
  const updateExam = useExamsStore((s) => s.updateExam)
  const getByPatient = useExamsStore((s) => s.getByPatient)
  const templates = useExamsStore((s) => s.templates)
  const addTemplate = useExamsStore((s) => s.addTemplate)
  const user = useAuthStore((s) => s.currentUser)
  const log = useAuditStore((s) => s.log)
  const clinic = useSettingsStore((s) => s.clinic)

  const patient = patientId ? getPatient(patientId) : undefined
  const existing = examId ? getByPatient(patientId!).find((e) => e.id === examId) : undefined

  const [vitals, setVitals] = useState<VitalSigns>(existing?.vitals ?? {})
  const [chiefComplaint, setChiefComplaint] = useState(existing?.chiefComplaint ?? '')
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis ?? '')
  const [treatment, setTreatment] = useState(existing?.treatment ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(existing?.prescriptions ?? [])
  const [followUp, setFollowUp] = useState(existing?.followUpDate ?? '')

  // Modal state
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [showLabModal, setShowLabModal] = useState(false)
  const [showSickLeaveModal, setShowSickLeaveModal] = useState(false)
  const [showXrayModal, setShowXrayModal] = useState(false)
  const [printType, setPrintType] = useState<PrintType>('prescription')
  const [labTests, setLabTests] = useState<string[]>([])
  const [labNotes, setLabNotes] = useState('')
  const [xrayData, setXrayData] = useState<{ modality: string; region: string; indication: string; notes: string }>({
    modality: 'أشعة بسيطة',
    region: 'صدر',
    indication: '',
    notes: '',
  })
  const [sickLeaveData, setSickLeaveData] = useState(() => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 2) // 3 days default: today + 2
    return {
      days: 3,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      reason: '',
    }
  })
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('general')
  const [savedExam, setSavedExam] = useState<Exam | null>(existing || null)
  const isDirtyRef = useRef(false)

  useEffect(() => {
    if (existing) {
      setVitals(existing.vitals)
      setChiefComplaint(existing.chiefComplaint)
      setDiagnosis(existing.diagnosis)
      setTreatment(existing.treatment)
      setNotes(existing.notes ?? '')
      setPrescriptions(existing.prescriptions)
      setFollowUp(existing.followUpDate ?? '')
      setSavedExam(existing)
    }
  }, [existing])

  // Track dirty state
  useEffect(() => {
    isDirtyRef.current = true
  }, [vitals, chiefComplaint, diagnosis, treatment, notes, prescriptions, followUp])

  // تحديث endDate تلقائياً عند تغيير days أو startDate
  useEffect(() => {
    if (!sickLeaveData.startDate) return
    const start = new Date(sickLeaveData.startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + Math.max(0, (sickLeaveData.days || 1) - 1))
    const endStr = end.toISOString().split('T')[0]
    if (endStr !== sickLeaveData.endDate) {
      setSickLeaveData((s) => ({ ...s, endDate: endStr }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sickLeaveData.days, sickLeaveData.startDate])

  // Listen for global save event (Ctrl+S)
  useEffect(() => {
    const handler = () => onSave('save')
    window.addEventListener('synapse:save', handler)
    return () => window.removeEventListener('synapse:save', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitals, chiefComplaint, diagnosis, treatment, notes, prescriptions, followUp])

  if (!patient) {
    return (
      <div className="grid h-[60vh] place-items-center text-sm text-[var(--text-3)]">
        {t.patientNotFound}
      </div>
    )
  }

  const vitalFields: VitalField[] = [
    { key: 'temperature', label: t.vitals.temperature, unit: t.vitalsUnit.temperature, icon: Thermometer, placeholder: '37.0', type: 'number', step: 0.1, min: 30, max: 45 },
    { key: 'weightKg', label: t.vitals.weight, unit: t.vitalsUnit.weight, icon: Weight, placeholder: '15', type: 'number', step: 0.1, min: 0, max: 200 },
    { key: 'heightCm', label: t.vitals.height, unit: t.vitalsUnit.height, icon: Ruler, placeholder: '100', type: 'number', min: 0, max: 220 },
    { key: 'headCircumferenceCm', label: t.vitals.head, unit: t.vitalsUnit.head, icon: Ruler, placeholder: '50', type: 'number', step: 0.1, min: 0, max: 70 },
    { key: 'heartRate', label: t.vitals.heartRate, unit: t.vitalsUnit.heartRate, icon: HeartPulse, placeholder: '95', type: 'number', min: 30, max: 220 },
    { key: 'respiratoryRate', label: t.vitals.respRate, unit: t.vitalsUnit.respRate, icon: Wind, placeholder: '20', type: 'number', min: 0, max: 100 },
    { key: 'oxygenSaturation', label: t.vitals.oxygen, unit: t.vitalsUnit.oxygen, icon: Droplets, placeholder: '98', type: 'number', min: 50, max: 100 },
    { key: 'bloodPressureSystolic', label: t.vitals.bp, unit: t.vitalsUnit.bp, icon: Activity, placeholder: '110/70', type: 'number', min: 40, max: 200 },
  ]

  const applyTemplate = (tplId: string) => {
    const tpl = templates.find((tt) => tt.id === tplId)
    if (!tpl) return
    setDiagnosis(tpl.diagnosis)
    setTreatment(tpl.treatment)
    setPrescriptions(
      tpl.prescriptions.map((p) => ({ id: generateId('rx'), ...p }))
    )
    toast.success(
      lang === 'ar' ? 'تم تطبيق القالب' : 'Template applied',
      tpl.name
    )
  }

  const addPrescription = () => {
    setPrescriptions((p) => [
      ...p,
      { id: generateId('rx'), medicationName: '', dosage: '', frequency: '', durationDays: 5 },
    ])
  }

  const updateRx = (id: string, data: Partial<Prescription>) => {
    setPrescriptions((p) => p.map((r) => (r.id === id ? { ...r, ...data } : r)))
  }

  const removeRx = (id: string) => setPrescriptions((p) => p.filter((r) => r.id !== id))

  const onSave = (action: 'save' | 'print' | 'stay' = 'save'): Exam | null => {
    if (!diagnosis.trim()) {
      toast.error(
        lang === 'ar' ? 'التشخيص مطلوب' : 'Diagnosis required',
        lang === 'ar' ? 'الرجاء إدخال التشخيص قبل الحفظ' : 'Please enter a diagnosis'
      )
      return null
    }
    const payload = {
      patientId: patient.id,
      doctorId: user?.id ?? 'unknown',
      examDate: new Date().toISOString(),
      chiefComplaint,
      vitals,
      diagnosis,
      treatment,
      notes,
      followUpDate: followUp || undefined,
      prescriptions,
    }
    let saved: Exam
    if (existing) {
      updateExam(existing.id, payload)
      saved = { ...existing, ...payload }
    } else {
      saved = addExam(payload)
    }
    touch(patient.id)
    log({
      userId: user?.id ?? 'unknown',
      userName: user?.fullName ?? 'unknown',
      action: existing ? 'update_exam' : 'create_exam',
      entityType: 'exam',
      entityId: saved.id,
      details: { patientId: patient.id },
    })
    setSavedExam(saved)
    isDirtyRef.current = false

    if (action === 'print') {
      setShowPrintPreview(true)
    } else if (action === 'save') {
      toast.success(t.examSaved || (lang === 'ar' ? 'تم حفظ الكشف' : 'Exam saved'))
      navigate('/patients/' + patient.id)
    }
    return saved
  }

  const saveAsTemplate = () => {
    if (!templateName.trim()) {
      toast.error(
        lang === 'ar' ? 'اسم القالب مطلوب' : 'Template name required'
      )
      return
    }
    const tpl: Omit<ExamTemplate, 'id'> = {
      name: templateName.trim(),
      category: templateCategory,
      diagnosis,
      treatment,
      prescriptions: prescriptions.map(({ id: _id, ...rest }) => rest),
    }
    addTemplate(tpl)
    log({
      userId: user?.id ?? 'unknown',
      userName: user?.fullName ?? 'unknown',
      action: 'create_exam' as any,
      entityType: 'exam' as any,
      entityId: templateName,
      details: { type: 'template' },
    })
    toast.success(
      lang === 'ar' ? 'تم حفظ القالب' : 'Template saved',
      templateName
    )
    setShowSaveTemplate(false)
    setTemplateName('')
  }

  const handlePrint = (type: PrintType) => {
    setPrintType(type)
    if (type === 'lab') {
      setShowLabModal(true)
      return
    }
    if (type === 'sickleave') {
      setShowSickLeaveModal(true)
      return
    }
    if (type === 'xray') {
      setShowXrayModal(true)
      return
    }
    // For prescription & summary, save first if not saved
    if (!savedExam && !existing) {
      const result = onSave('print')
      if (!result) return
    } else if (!savedExam && existing) {
      setSavedExam(existing)
    }
    setShowPrintPreview(true)
  }

  // Derived metrics
  const bmi = useMemo(() => {
    if (vitals.weightKg && vitals.heightCm) {
      const m = vitals.heightCm / 100
      return (vitals.weightKg / (m * m)).toFixed(1)
    }
    return null
  }, [vitals.weightKg, vitals.heightCm])

  return (
    <div className="space-y-5">
      <FadeIn>
        <button
          onClick={() => navigate('/patients/' + patient.id)}
          className="flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t.back}
        </button>
      </FadeIn>

      {/* Header */}
      <FadeIn>
        <Card padding="md" className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -end-12 h-40 w-40 rounded-full bg-gradient-to-br from-teal-500/15 to-blue-500/15 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={patient.fullName} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    {existing ? lang === 'ar' ? 'تعديل الكشف' : 'Edit exam' : t.newExamTitle}
                  </h1>
                  <Badge tone="info" icon={<Stethoscope className="h-3 w-3" />}>
                    {lang === 'ar' ? 'مساحة الكشف' : 'Workspace'}
                  </Badge>
                </div>
                <div className="mt-0.5 text-sm text-[var(--text-2)]">
                  {patient.fullName} • {formatAge(patient.birthDate, lang)} • {patient.gender === 'male' ? t.male : t.female}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<BookMarked className="h-3.5 w-3.5" />}
                onClick={() => setShowSaveTemplate(true)}
                disabled={!diagnosis.trim()}
              >
                {lang === 'ar' ? 'حفظ كقالب' : 'Save as template'}
              </Button>
              <PrintMenu
                onPrint={(type) => handlePrint(type)}
                onPreview={(type) => handlePrint(type)}
                disabled={!savedExam && !existing}
              />
              <Button variant="primary" leftIcon={<Save className="h-4 w-4" />} onClick={() => onSave('save')}>
                {t.saveExam}
              </Button>
            </div>
          </div>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left col - Vitals + Complaint */}
        <div className="space-y-5 lg:col-span-2">
          <FadeIn delay={0.05}>
            <Card padding="md">
              <CardHeader
                title={t.vitalSigns}
                description={lang === 'ar' ? 'أدخل القياسات المسجلة' : 'Enter recorded measurements'}
                icon={<Activity className="h-4 w-4" />}
                action={
                  bmi && (
                    <div className="flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      BMI {bmi}
                    </div>
                  )
                }
              />
              <Stagger className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                {vitalFields.map((f) => {
                  const value = vitals[f.key]
                  return (
                    <StaggerItem key={f.key}>
                      <div
                        className={cn(
                          'group rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--bg-2)]/40 p-2.5 transition-all hover:border-[var(--primary-2)]/40 hover:shadow-soft'
                        )}
                      >
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--primary-2)]">
                            <f.icon className="h-3 w-3" />
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                            {f.label}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <input
                            type={f.type ?? 'text'}
                            inputMode={f.type === 'number' ? 'decimal' : undefined}
                            value={value === undefined ? '' : String(value)}
                            onChange={(e) => {
                              const v = e.target.value
                              setVitals((s) => ({
                                ...s,
                                [f.key]: v === '' ? undefined : Number(v),
                              }))
                            }}
                            placeholder={f.placeholder}
                            min={f.min}
                            max={f.max}
                            step={f.step}
                            className="w-full bg-transparent text-base font-bold text-[var(--text)] outline-none placeholder:text-[var(--text-3)]"
                          />
                          <span className="text-[10px] text-[var(--text-3)]">{f.unit}</span>
                        </div>
                      </div>
                    </StaggerItem>
                  )
                })}
              </Stagger>
            </Card>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card padding="md">
              <CardHeader
                title={t.chiefComplaint}
                icon={<FileText className="h-4 w-4" />}
              />
              <Textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: حرارة وسعال منذ يومين' : 'e.g. Fever & cough for 2 days'}
                rows={2}
                className="mt-3"
              />
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card padding="md">
              <CardHeader
                title={t.diagnosis}
                icon={<Stethoscope className="h-4 w-4" />}
                action={
                  <div className="flex items-center gap-2">
                    <Select
                      value=""
                      onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                      className="h-8 w-44 text-xs"
                    >
                      <option value="">{t.templates}</option>
                      {templates.map((tt) => (
                        <option key={tt.id} value={tt.id}>
                          {tt.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                }
              />
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب التشخيص هنا...' : 'Type the diagnosis here...'}
                rows={3}
                className="mt-3"
              />

              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {t.treatment}
                </label>
                <Textarea
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {t.notes}
                  </label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {t.followUpDate}
                  </label>
                  <Input
                    type="date"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card padding="md">
              <CardHeader
                title={t.prescriptions}
                description={lang === 'ar' ? `${prescriptions.length} دواء` : `${prescriptions.length} medications`}
                icon={<Pill className="h-4 w-4" />}
                action={
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={addPrescription}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    {t.addPrescription}
                  </Button>
                }
              />
              <div className="mt-3 space-y-3">
                {prescriptions.length === 0 && (
                  <button
                    onClick={addPrescription}
                    className="group flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center transition-all hover:border-[var(--primary-2)]/50 hover:bg-[var(--primary)]/5"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 text-[var(--primary-2)] transition-transform group-hover:scale-110">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold">
                      {lang === 'ar' ? 'أضف أول دواء' : 'Add first medication'}
                    </div>
                    <div className="text-xs text-[var(--text-3)]">
                      {lang === 'ar' ? 'انقر هنا أو استخدم زر الإضافة أعلاه' : 'Click here or use the button above'}
                    </div>
                  </button>
                )}
                <AnimatePresence>
                  {prescriptions.map((rx, i) => (
                    <motion.div
                      key={rx.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                      className="space-y-3 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--bg-2)]/40 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-2)]">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--primary)]/10 text-[var(--primary-2)]">
                            {i + 1}
                          </span>
                          {lang === 'ar' ? 'دواء' : 'Medication'}
                        </div>
                        <button
                          onClick={() => removeRx(rx.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
                          aria-label={t.delete}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? 'حذف' : 'Remove'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-5">
                          <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                            {t.medication}
                          </label>
                          <Input
                            placeholder={t.medication}
                            value={rx.medicationName}
                            onChange={(e) => updateRx(rx.id, { medicationName: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                            {t.dosage}
                          </label>
                          <Input
                            placeholder={t.dosage}
                            value={rx.dosage}
                            onChange={(e) => updateRx(rx.id, { dosage: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                            {t.frequency}
                          </label>
                          <Input
                            placeholder={t.frequency}
                            value={rx.frequency}
                            onChange={(e) => updateRx(rx.id, { frequency: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                            {t.durationDays}
                          </label>
                          <Input
                            type="number"
                            placeholder={t.durationDays}
                            value={rx.durationDays}
                            onChange={(e) => updateRx(rx.id, { durationDays: Number(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                          {t.instructions}
                        </label>
                        <Input
                          placeholder={t.instructions}
                          value={rx.instructions ?? ''}
                          onChange={(e) => updateRx(rx.id, { instructions: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* Right col - Patient summary */}
        <div className="space-y-5">
          <FadeIn delay={0.1}>
            <Card padding="md">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {t.tabs.overview}
              </h3>
              <PatientBadge
                name={patient.fullName}
                age={formatAge(patient.birthDate, lang)}
                gender={patient.gender}
                size="lg"
              />
              <div className="mt-3 space-y-1.5 text-xs">
                {patient.bloodType && <Row label={t.bloodType} value={patient.bloodType} />}
                {patient.allergies && patient.allergies.trim() && (
                  <Row label={t.allergies} value={patient.allergies} warn />
                )}
                {patient.chronicConditions && patient.chronicConditions.trim() && (
                  <Row label={t.chronicConditions} value={patient.chronicConditions} warn />
                )}
                <Row label={t.phone} value={patient.phone || patient.parentPhone} />
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card padding="md">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {lang === 'ar' ? 'الزيارات السابقة' : 'Recent visits'}
              </h3>
              <div className="space-y-2">
                {getByPatient(patient.id).slice(0, 4).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => navigate(`/exams/${patient.id}/${e.id}`)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 text-start transition-all hover:border-[var(--primary-2)]/40 hover:shadow-soft"
                  >
                    <div className="text-[10px] text-[var(--text-3)]">
                      {formatDate(e.examDate, lang)}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-xs font-semibold">{e.diagnosis}</div>
                  </button>
                ))}
                {getByPatient(patient.id).length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-3)]">
                    {lang === 'ar' ? 'لا توجد زيارات سابقة' : 'No previous visits'}
                  </div>
                )}
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card padding="md" className="border-dashed bg-gradient-to-br from-blue-500/5 to-violet-500/5">
              <div className="flex items-start gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold">{lang === 'ar' ? 'نصيحة ذكية' : 'Smart tip'}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-2)]">
                    {lang === 'ar'
                      ? 'يمكنك استخدام القوالب لتعبئة التشخيص والعلاج بسرعة. أو احفظ الكشف الحالي كقالب جديد لاستخدامه لاحقاً.'
                      : 'Use templates to autofill common diagnoses, or save this exam as a new template for later.'}
                  </p>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Print Preview Modal */}
      {savedExam && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={
            printType === 'prescription'
              ? lang === 'ar' ? 'معاينة الوصفة' : 'Prescription preview'
              : lang === 'ar' ? 'معاينة ملخص الزيارة' : 'Visit summary preview'
          }
          description={lang === 'ar' ? 'راجع المطبوع قبل الطباعة' : 'Review before printing'}
          paperSize={clinic.print.paperSize}
        >
          {printType === 'prescription' ? (
            <PrescriptionPrintable
              exam={savedExam}
              patient={patient}
              doctor={user}
              clinic={clinic as ClinicInfo}
            />
          ) : (
            <VisitSummaryPrintable
              exam={savedExam}
              patient={patient}
              doctor={user}
              clinic={clinic as ClinicInfo}
            />
          )}
        </PrintPreviewModal>
      )}

      {/* Lab Request Modal */}
      <LabRequestModal
        open={showLabModal}
        onClose={() => setShowLabModal(false)}
        onConfirm={(tests, notes) => {
          setLabTests(tests)
          setLabNotes(notes)
          setShowLabModal(false)
          if (!savedExam && !existing) {
            const result = onSave('print')
            if (!result) return
          } else if (!savedExam && existing) {
            setSavedExam(existing)
          }
          setPrintType('lab')
          setShowPrintPreview(true)
        }}
      />

      {/* Sick Leave Modal */}
      <SickLeaveModal
        open={showSickLeaveModal}
        onClose={() => setShowSickLeaveModal(false)}
        onConfirm={(data) => {
          setSickLeaveData(data)
          setShowSickLeaveModal(false)
          if (!savedExam && !existing) {
            const result = onSave('print')
            if (!result) return
          } else if (!savedExam && existing) {
            setSavedExam(existing)
          }
          setPrintType('sickleave')
          setShowPrintPreview(true)
        }}
      />

      {/* X-Ray Request Modal */}
      <XRayRequestModal
        open={showXrayModal}
        onClose={() => setShowXrayModal(false)}
        chiefComplaint={chiefComplaint}
        onConfirm={(data) => {
          setXrayData(data)
          setShowXrayModal(false)
          if (!savedExam && !existing) {
            const result = onSave('print')
            if (!result) return
          } else if (!savedExam && existing) {
            setSavedExam(existing)
          }
          setPrintType('xray')
          setShowPrintPreview(true)
        }}
      />

      {/* X-Ray Print Preview */}
      {printType === 'xray' && savedExam && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة طلب الأشعة' : 'Imaging request preview'}
          description={`${xrayData.modality} • ${xrayData.region}`}
          paperSize={clinic.print.paperSize}
        >
          <XRayRequestPrintable
            exam={savedExam}
            patient={patient}
            doctor={user}
            clinic={clinic as ClinicInfo}
            modality={xrayData.modality}
            region={xrayData.region}
            indication={xrayData.indication}
            notes={xrayData.notes}
          />
        </PrintPreviewModal>
      )}

      {/* Lab/Sick Leave Print Preview */}
      {printType === 'lab' && savedExam && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة طلب التحاليل' : 'Lab request preview'}
          description={lang === 'ar' ? `${labTests.length} تحليل` : `${labTests.length} tests`}
          paperSize={clinic.print.paperSize}
        >
          <LabRequestPrintable
            exam={savedExam}
            patient={patient}
            doctor={user}
            clinic={clinic as ClinicInfo}
            tests={labTests}
          />
        </PrintPreviewModal>
      )}

      {printType === 'sickleave' && savedExam && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة الشهادة الطبية' : 'Medical certificate preview'}
          description={lang === 'ar' ? `${sickLeaveData.days} أيام` : `${sickLeaveData.days} days`}
          paperSize={clinic.print.paperSize}
        >
          <SickLeavePrintable
            patient={patient}
            doctor={user}
            clinic={clinic as ClinicInfo}
            days={sickLeaveData.days}
            startDate={sickLeaveData.startDate}
            endDate={sickLeaveData.endDate}
            reason={sickLeaveData.reason}
          />
        </PrintPreviewModal>
      )}

      {/* Save as Template Modal */}
      <Modal
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        title={lang === 'ar' ? 'حفظ كقالب جديد' : 'Save as new template'}
        description={lang === 'ar' ? 'سيتم حفظ التشخيص والعلاج والأدوية الحالية كقالب جاهز للاستخدام لاحقاً' : 'Save current diagnosis, treatment and prescriptions as a reusable template'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSaveTemplate(false)} leftIcon={<X className="h-4 w-4" />}>
              {t.cancel}
            </Button>
            <Button variant="primary" onClick={saveAsTemplate} leftIcon={<Check className="h-4 w-4" />}>
              {t.save}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {lang === 'ar' ? 'اسم القالب' : 'Template name'}
            </label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: التهاب الحلق العقدي' : 'e.g. Strep throat'}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {lang === 'ar' ? 'الفئة' : 'Category'}
            </label>
            <Select
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full"
            >
              <option value="general">{lang === 'ar' ? 'عام' : 'General'}</option>
              <option value="respiratory">{lang === 'ar' ? 'الجهاز التنفسي' : 'Respiratory'}</option>
              <option value="digestive">{lang === 'ar' ? 'الجهاز الهضمي' : 'Digestive'}</option>
              <option value="dermatology">{lang === 'ar' ? 'الجلدية' : 'Dermatology'}</option>
              <option value="ent">{lang === 'ar' ? 'الأنف والأذن والحنجرة' : 'ENT'}</option>
              <option value="vaccine">{lang === 'ar' ? 'لقاحات' : 'Vaccines'}</option>
              <option value="followup">{lang === 'ar' ? 'متابعة' : 'Follow-up'}</option>
            </Select>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)]/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {lang === 'ar' ? 'معاينة' : 'Preview'}
            </div>
            <div className="mt-1.5 space-y-1 text-xs">
              <div className="line-clamp-1">
                <span className="text-[var(--text-3)]">{lang === 'ar' ? 'التشخيص: ' : 'Dx: '}</span>
                <span className="font-semibold">{diagnosis || '—'}</span>
              </div>
              <div className="line-clamp-1">
                <span className="text-[var(--text-3)]">{lang === 'ar' ? 'العلاج: ' : 'Tx: '}</span>
                <span className="font-semibold">{treatment || '—'}</span>
              </div>
              <div>
                <span className="text-[var(--text-3)]">
                  {lang === 'ar' ? 'الأدوية: ' : 'Rx: '}
                </span>
                <span className="font-semibold">{prescriptions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-[var(--text-2)]">{label}</span>
      <span className={cn('text-end font-medium', warn ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text)]')}>
        {value}
      </span>
    </div>
  )
}
