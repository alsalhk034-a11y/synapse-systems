import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import {
  ChevronLeft,
  Cake,
  Phone,
  MapPin,
  Stethoscope,
  Receipt,
  Syringe,
  FileText,
  Plus,
  Activity,
  Trash2,
  Pill,
  FlaskConical,
  ScanLine,
  FileCheck2,
  Printer,
  Heart,
  AlertTriangle,
  Eye,
  Brain,
  Users,
  Baby,
  GraduationCap,
  ShieldCheck,
  IdCard,
  TrendingUp,
  Calendar,
  Mail,
  Droplet,
  Building2,
  KeyRound,
  Copy,
  Smartphone,
  RotateCw,
  ListOrdered,
  AlertCircle,
  HeartPulse,
  MessageSquare,
  UserCheck,
  UserX,
  Pause,
  Check,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { usePatientsStore } from '@/stores/patientsStore'
import { useExamsStore } from '@/stores/examsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useVaccinesStore } from '@/stores/vaccinesStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useAuthStore } from '@/stores/authStore'
import { useQueueStore, getQueuePosition } from '@/stores/queueStore'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar, PatientBadge } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/Motion'
import { Modal } from '@/components/ui/Modal'
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal'
import { PrintMenu, type PrintType } from '@/components/print/PrintMenu'
import { LabRequestModal } from '@/components/print/LabRequestModal'
import { SickLeaveModal } from '@/components/print/SickLeaveModal'
import { XRayRequestModal } from '@/components/print/XRayRequestModal'
import { PrescriptionPrintable, VisitSummaryPrintable, LabRequestPrintable, SickLeavePrintable, XRayRequestPrintable } from '@/components/print/Printable'
import { formatAge, formatDate, formatCurrency, formatRelative } from '@/lib/format'
import { useSettingsStore } from '@/stores/settingsStore'
import { useConfirm } from '@/components/notifications/Confirm'
import { toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'
import type { ClinicInfo } from '@/types/user'

type Tab = 'overview' | 'queue' | 'medical' | 'history' | 'vaccines' | 'invoices'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const getPatient = usePatientsStore((s) => s.getPatient)
  const updatePatient = usePatientsStore((s) => s.updatePatient)
  const deletePatient = usePatientsStore((s) => s.deletePatient)
  const exams = useExamsStore(useShallow((s) => s.getByPatient(id ?? '')))
  const invoices = useInvoicesStore(useShallow((s) => s.getByPatient(id ?? '')))
  const vaccines = useVaccinesStore(useShallow((s) => s.getByPatient(id ?? '')))
  const appointments = useAppointmentsStore(useShallow((s) => s.getByPatient(id ?? '')))
  const currency = useSettingsStore((s) => s.clinic.currency)
  const clinic = useSettingsStore((s) => s.clinic)
  const user = useAuthStore((s) => s.currentUser)
  const getPatientAccount = useAuthStore((s) => s.getPatientAccount)
  const createPatientAccount = useAuthStore((s) => s.createPatientAccount)
  const resetPatientPassword = useAuthStore((s) => s.resetPatientPassword)
  const queueEntry = useQueueStore((s) => s.getByPatient(id ?? ''))
  const addToQueue = useQueueStore((s) => s.addToQueue)
  const updateQueueStatus = useQueueStore((s) => s.updateStatus)
  const removeFromQueue = useQueueStore((s) => s.removeFromQueue)
  const allQueueEntries = useQueueStore((s) => s.entries)

  const [tab, setTab] = useState<Tab>('overview')
  const patient = id ? getPatient(id) : undefined

  // إذا قمنا بإنشاء حساب من PatientNew، نعرض بيانات الدخول تلقائياً
  const [newAccountInfo, setNewAccountInfo] = useState<{ username: string; password: string } | null>(null)
  useEffect(() => {
    if (searchParams.get('newAccount') === '1') {
      const u = searchParams.get('u')
      const p = searchParams.get('p')
      if (u && p) {
        setNewAccountInfo({ username: u, password: p })
      }
      // تنظيف الـ URL params فوراً لمنع إعادة الفتح عند refresh
      const next = new URLSearchParams(searchParams)
      next.delete('newAccount')
      next.delete('u')
      next.delete('p')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Print state
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [showLabModal, setShowLabModal] = useState(false)
  const [showSickLeaveModal, setShowSickLeaveModal] = useState(false)
  const [showXrayModal, setShowXrayModal] = useState(false)
  const [printType, setPrintType] = useState<PrintType>('prescription')
  const [labTests, setLabTests] = useState<string[]>([])
  const [xrayData, setXrayData] = useState({ modality: 'أشعة بسيطة', region: 'صدر', indication: '', notes: '' })
  const [sickLeaveData, setSickLeaveData] = useState({
    days: 3,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  })

  if (!patient) {
    return (
      <EmptyState
        size="lg"
        tone="warning"
        title={t.patientNotFound}
        description={
          lang === 'ar'
            ? 'المريض الذي تبحث عنه غير موجود أو تم حذفه.'
            : 'The patient you are looking for does not exist or has been deleted.'
        }
        icon={<UserX />}
        action={
          <Button variant="primary" onClick={() => navigate('/patients')}>
            {t.allPatients}
          </Button>
        }
      />
    )
  }

  const onDelete = async () => {
    const ok = await confirm({
      title: lang === 'ar' ? `حذف ${patient!.fullName}؟` : `Delete ${patient!.fullName}?`,
      description: lang === 'ar'
        ? 'سيتم حذف المريض وجميع بياناته (الكشوفات، الفواتير، اللقاحات). هذا الإجراء لا يمكن التراجع عنه.'
        : 'This will delete the patient and all their data (exams, invoices, vaccines). This action cannot be undone.',
      confirmText: lang === 'ar' ? 'حذف' : 'Delete',
      cancelText: t.cancel,
      tone: 'danger',
    })
    if (ok) {
      deletePatient(patient!.id)
      toast.success(lang === 'ar' ? 'تم حذف المريض' : 'Patient deleted')
      navigate('/patients')
    }
  }

  // آخر كشف (يستخدم في الطباعة)
  const latestExam = exams[0]

  const handlePrint = (type: PrintType) => {
    setPrintType(type)
    if (type === 'lab') { setShowLabModal(true); return }
    if (type === 'sickleave') { setShowSickLeaveModal(true); return }
    if (type === 'xray') { setShowXrayModal(true); return }
    if (!latestExam) {
      // إذا لم يوجد كشف بعد، نطلب إنشاء كشف أولاً للوصفة/الملخص
      if (type === 'prescription' || type === 'summary') {
        navigate('/exams/' + patient!.id)
        return
      }
      setShowPrintPreview(true)
      return
    }
    setShowPrintPreview(true)
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t.back}
        </button>
      </FadeIn>

      {/* Hero */}
      <FadeIn>
        <Card padding="lg" className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-20 -end-20 h-60 w-60 rounded-full bg-gradient-to-br from-blue-500/15 to-violet-500/15 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar name={patient.fullName} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {patient.fullName}
                </h1>
                <Badge tone="info" className="font-mono text-[10px]">
                  <IdCard className="me-1 inline h-3 w-3" />
                  {patient.mrn}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--text-2)]">
                <span className="flex items-center gap-1.5">
                  <Cake className="h-3.5 w-3.5" />
                  {formatAge(patient.birthDate, lang)} • {patient.gender === 'male' ? t.male : t.female}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {patient.phone || patient.parentPhone}
                </span>
                {patient.parentName && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {patient.parentName}
                  </span>
                )}
                {patient.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {patient.address}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {patient.bloodType && (
                  <Badge tone="info">
                    <Droplet className="me-1 inline h-3 w-3" />
                    {t.bloodType}: {patient.bloodType}
                  </Badge>
                )}
                {patient.allergiesDetailed && patient.allergiesDetailed.length > 0 && (
                  <Badge tone="danger">
                    <AlertTriangle className="me-1 inline h-3 w-3" />
                    {patient.allergiesDetailed.length} {lang === 'ar' ? 'حساسية' : 'allergies'}
                  </Badge>
                )}
                {patient.allergies && patient.allergies.trim() && (
                  <Badge tone="warning">⚠ {t.allergies}: {patient.allergies}</Badge>
                )}
                {patient.chronicConditions && patient.chronicConditions.trim() && (
                  <Badge tone="danger">{patient.chronicConditions}</Badge>
                )}
                {patient.insurance && (
                  <Badge tone="success">
                    <ShieldCheck className="me-1 inline h-3 w-3" />
                    {patient.insurance.provider}
                  </Badge>
                )}
                <Badge tone="neutral">
                  {patient.lastVisitAt ? `${t.lastVisit}: ${formatRelative(patient.lastVisitAt, lang)}` : t.neverVisited}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                leftIcon={<Stethoscope className="h-4 w-4" />}
                onClick={() => navigate('/exams/' + patient.id)}
              >
                {t.newExam}
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Receipt className="h-4 w-4" />}
                onClick={() => navigate('/invoices/new?patientId=' + patient.id)}
              >
                {t.newInvoice}
              </Button>
              <PrintMenu
                onPrint={(type) => handlePrint(type)}
                onPreview={(type) => handlePrint(type)}
                disabled={false}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                title={t.delete}
                className="text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* أزرار الطباعة السريعة - كبسة زر */}
      <FadeIn delay={0.05}>
        <Card padding="md" className="border-dashed bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-rose-500/5">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">{lang === 'ar' ? 'مطبوعات سريعة' : 'Quick print'}</div>
              <div className="text-[11px] text-[var(--text-3)]">
                {lang === 'ar' ? 'بضغطة زر اطبع كل ما يلزم للمريض' : 'One-click print for the patient'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<Pill className="h-3.5 w-3.5 text-blue-500" />}
              onClick={() => handlePrint('prescription')}
              disabled={!latestExam}
              className="justify-start"
            >
              {lang === 'ar' ? 'وصفة طبية' : 'Prescription'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<FlaskConical className="h-3.5 w-3.5 text-emerald-500" />}
              onClick={() => handlePrint('lab')}
              className="justify-start"
            >
              {lang === 'ar' ? 'طلب تحاليل' : 'Lab request'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<ScanLine className="h-3.5 w-3.5 text-rose-500" />}
              onClick={() => handlePrint('xray')}
              className="justify-start"
            >
              {lang === 'ar' ? 'طلب أشعة' : 'Imaging request'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<FileCheck2 className="h-3.5 w-3.5 text-amber-500" />}
              onClick={() => handlePrint('sickleave')}
              className="justify-start"
            >
              {lang === 'ar' ? 'إجازة مرضية' : 'Sick leave'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              leftIcon={<FileText className="h-3.5 w-3.5 text-violet-500" />}
              onClick={() => handlePrint('summary')}
              disabled={!latestExam}
              className="justify-start"
            >
              {lang === 'ar' ? 'ملخص الزيارة' : 'Visit summary'}
            </Button>
          </div>
        </Card>
      </FadeIn>

      {/* بطاقة حساب المريض في البوابة الإلكترونية */}
      <FadeIn delay={0.07}>
        <PatientAccountCard
          patientId={patient!.id}
          fullName={patient!.fullName}
          birthDate={patient!.birthDate}
          getPatientAccount={getPatientAccount}
          createPatientAccount={createPatientAccount}
          resetPatientPassword={resetPatientPassword}
          lang={lang}
        />
      </FadeIn>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)]">
        {(
          [
            { v: 'overview' as Tab, l: t.tabs.overview, icon: Activity },
            { v: 'queue' as Tab, l: lang === 'ar' ? 'الدور والحالة' : 'Status & Queue', icon: ListOrdered, count: queueEntry && (queueEntry.status === 'waiting' || queueEntry.status === 'in-progress') ? 1 : 0 },
            { v: 'medical' as Tab, l: lang === 'ar' ? 'السجل الطبي' : 'Medical record', icon: Heart },
            { v: 'history' as Tab, l: t.tabs.history, icon: FileText, count: exams.length },
            { v: 'vaccines' as Tab, l: t.tabs.vaccines, icon: Syringe, count: vaccines.length },
            { v: 'invoices' as Tab, l: t.tabs.invoices, icon: Receipt, count: invoices.length },
          ]
        ).map((tt) => (
          <button
            key={tt.v}
            onClick={() => setTab(tt.v)}
            className={cn(
              'relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === tt.v
                ? 'border-[var(--primary-2)] text-[var(--text)]'
                : 'border-transparent text-[var(--text-2)] hover:text-[var(--text)]'
            )}
          >
            <tt.icon className="h-4 w-4" />
            {tt.l}
            {tt.count !== undefined && tt.count > 0 && (
              <span className="rounded-full bg-[var(--bg-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-2)]">
                {tt.count}
              </span>
            )}
            {tab === tt.v && (
              <motion.span
                layoutId="patient-tab"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-blue-500 to-violet-500"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'queue' && patient && (
          <PatientQueueStatusTab
            patient={patient}
            queueEntry={queueEntry}
            position={queueEntry ? getQueuePosition(allQueueEntries, queueEntry.id) : 0}
            onAddToQueue={(priority) => {
              const entry = addToQueue({
                patientId: patient.id,
                patientName: patient.fullName,
                priority: priority || 'normal',
                createdBy: user?.id,
                reason: lang === 'ar' ? 'حجز دور' : 'Walk-in',
              })
              if (entry) {
                const msg = lang === 'ar'
                  ? `تم حجز دور رقم #${entry.number} للمريض`
                  : `Queue number #${entry.number} assigned`
                alert(msg)
              }
            }}
            onUpdateStatus={(s) => queueEntry && updateQueueStatus(queueEntry.id, s)}
            onRemove={() => queueEntry && removeFromQueue(queueEntry.id)}
            lang={lang}
          />
        )}
        {tab === 'overview' && (
          <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StaggerItem>
              <Card padding="md">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'العلامات الحيوية الأخيرة' : 'Latest vitals'}
                </h3>
                {exams[0]?.vitals ? (
                  <div className="space-y-1.5 text-sm">
                    {exams[0].vitals.weightKg && (
                      <Row label={t.vitals.weight} value={`${exams[0].vitals.weightKg} ${t.vitalsUnit.weight}`} />
                    )}
                    {exams[0].vitals.heightCm && (
                      <Row label={t.vitals.height} value={`${exams[0].vitals.heightCm} ${t.vitalsUnit.height}`} />
                    )}
                    {exams[0].vitals.temperature && (
                      <Row label={t.vitals.temperature} value={`${exams[0].vitals.temperature}${t.vitalsUnit.temperature}`} />
                    )}
                    {exams[0].vitals.heartRate && (
                      <Row label={t.vitals.heartRate} value={`${exams[0].vitals.heartRate} ${t.vitalsUnit.heartRate}`} />
                    )}
                    {exams[0].vitals.oxygenSaturation && (
                      <Row label={t.vitals.oxygen} value={`${exams[0].vitals.oxygenSaturation}%`} />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-3)]">{t.noData}</p>
                )}
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="md">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'إحصائيات' : 'Stats'}
                </h3>
                <div className="space-y-1.5 text-sm">
                  <Row label={t.visits} value={String(exams.length)} />
                  <Row label={t.invoices} value={String(invoices.length)} />
                  <Row label={t.vaccines} value={String(vaccines.length)} />
                  <Row
                    label={lang === 'ar' ? 'إجمالي المدفوع' : 'Total paid'}
                    value={formatCurrency(invoices.reduce((s, i) => s + i.paid, 0), currency, lang)}
                  />
                </div>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card padding="md">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {lang === 'ar' ? 'المواعيد القادمة' : 'Upcoming appointments'}
                </h3>
                <div className="space-y-2">
                  {appointments
                    .filter((a) => +new Date(a.scheduledAt) > Date.now())
                    .slice(0, 3)
                    .map((a) => (
                      <div key={a.id} className="flex items-center gap-2 rounded-lg bg-[var(--bg-2)] p-2 text-xs">
                        <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--primary)]/10 text-[10px] font-bold text-[var(--primary-2)]">
                          {new Date(a.scheduledAt).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US', { day: '2-digit' })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{a.reason}</div>
                          <div className="truncate text-[10px] text-[var(--text-3)]">
                            {new Date(a.scheduledAt).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}
                          </div>
                        </div>
                      </div>
                    ))}
                  {appointments.filter((a) => +new Date(a.scheduledAt) > Date.now()).length === 0 && (
                    <p className="text-sm text-[var(--text-3)]">{t.noUpcoming}</p>
                  )}
                </div>
              </Card>
            </StaggerItem>

            {patient.notes && (
              <StaggerItem className="lg:col-span-3">
                <Card padding="md">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {t.notes}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-2)]">{patient.notes}</p>
                </Card>
              </StaggerItem>
            )}
          </Stagger>
        )}

        {tab === 'history' && (
          <Stagger className="space-y-3">
            {exams.length === 0 ? (
              <EmptyState
                size="md"
                tone="primary"
                title={lang === 'ar' ? 'لا توجد كشوفات بعد' : 'No exams yet'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بتسجيل أول كشف طبي لهذا المريض.'
                    : 'Start by recording the first exam for this patient.'
                }
                icon={<FileText />}
                action={
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/patients/${id}/exam`)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    {t.newExam}
                  </Button>
                }
              />
            ) : (
              exams.map((e) => (
                <StaggerItem key={e.id}>
                  <Card hover padding="md" onClick={() => navigate(`/exams/${patient.id}/${e.id}`)} className="cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-[var(--text-3)]">{formatDate(e.examDate, lang)}</div>
                        <h3 className="mt-1 text-sm font-semibold text-[var(--text)]">
                          {e.diagnosis}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--text-2)]">
                          {e.chiefComplaint}
                        </p>
                        {e.prescriptions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {e.prescriptions.slice(0, 3).map((rx, i) => (
                              <Badge key={i} tone="subtle">{rx.medicationName}</Badge>
                            ))}
                            {e.prescriptions.length > 3 && (
                              <Badge tone="neutral">+{e.prescriptions.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))
            )}
          </Stagger>
        )}

        {tab === 'vaccines' && (
          <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {vaccines.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState
                  title={lang === 'ar' ? 'لا توجد لقاحات' : 'No vaccines'}
                  icon={<Syringe />}
                />
              </div>
            ) : (
              vaccines.map((v) => (
                <StaggerItem key={v.id}>
                  <Card padding="md">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-500/10 text-teal-500">
                        <Syringe className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{v.vaccineName}</div>
                        <div className="text-[11px] text-[var(--text-3)]">
                          {formatDate(v.administeredAt, lang)} • {v.batchNumber}
                        </div>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))
            )}
          </Stagger>
        )}

        {tab === 'invoices' && (
          <Stagger className="space-y-2">
            {invoices.length === 0 ? (
              <EmptyState
                title={t.noInvoices}
                icon={<Receipt />}
                action={
                  <Button
                    variant="primary"
                    onClick={() => navigate('/invoices/new?patientId=' + patient.id)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    {t.newInvoice}
                  </Button>
                }
              />
            ) : (
              invoices.map((i) => (
                <StaggerItem key={i.id}>
                  <Card hover padding="sm" className="!p-3 cursor-pointer" onClick={() => navigate('/invoices/' + i.id)}>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{i.number}</span>
                          <Badge
                            tone={
                              i.status === 'paid'
                                ? 'success'
                                : i.status === 'partial'
                                ? 'warning'
                                : i.status === 'cancelled'
                                ? 'danger'
                                : 'info'
                            }
                          >
                            {t[`invoiceStatus${i.status.charAt(0).toUpperCase() + i.status.slice(1)}` as keyof typeof t] as string}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-[var(--text-3)]">
                          {formatDate(i.createdAt, lang)} • {i.items.length} {lang === 'ar' ? 'بند' : 'items'}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-sm font-bold">{formatCurrency(i.total, i.currency, lang)}</div>
                        {i.paid > 0 && i.paid < i.total && (
                          <div className="text-[11px] text-amber-600">
                            {formatCurrency(i.paid, i.currency, lang)} {lang === 'ar' ? 'مدفوع' : 'paid'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))
            )}
          </Stagger>
        )}

        {tab === 'medical' && <MedicalRecordTab patient={patient} lang={lang} />}
      </div>

      {/* Modals الطباعة */}
      {latestExam && printType === 'prescription' && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة الوصفة' : 'Prescription preview'}
          paperSize={clinic.print.paperSize}
        >
          <PrescriptionPrintable
            exam={latestExam}
            patient={patient}
            doctor={user}
            clinic={clinic as ClinicInfo}
          />
        </PrintPreviewModal>
      )}

      {latestExam && printType === 'summary' && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة ملخص الزيارة' : 'Visit summary preview'}
          paperSize={clinic.print.paperSize}
        >
          <VisitSummaryPrintable
            exam={latestExam}
            patient={patient}
            doctor={user}
            clinic={clinic as ClinicInfo}
          />
        </PrintPreviewModal>
      )}

      {printType === 'lab' && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة طلب التحاليل' : 'Lab request preview'}
          paperSize={clinic.print.paperSize}
        >
          {latestExam ? (
            <LabRequestPrintable
              exam={latestExam}
              patient={patient}
              doctor={user}
              clinic={clinic as ClinicInfo}
              tests={labTests}
            />
          ) : (
            <LabRequestPrintable
              exam={{ examDate: new Date().toISOString(), diagnosis: '', chiefComplaint: '', vitals: {}, prescriptions: [] } as any}
              patient={patient}
              doctor={user}
              clinic={clinic as ClinicInfo}
              tests={labTests}
            />
          )}
        </PrintPreviewModal>
      )}

      {printType === 'xray' && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة طلب الأشعة' : 'Imaging request preview'}
          paperSize={clinic.print.paperSize}
        >
          <XRayRequestPrintable
            exam={latestExam || ({ examDate: new Date().toISOString() } as any)}
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

      {printType === 'sickleave' && (
        <PrintPreviewModal
          open={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          title={lang === 'ar' ? 'معاينة الشهادة الطبية' : 'Medical certificate preview'}
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

      <LabRequestModal
        open={showLabModal}
        onClose={() => setShowLabModal(false)}
        onConfirm={(tests) => {
          setLabTests(tests)
          setShowLabModal(false)
          setPrintType('lab')
          setShowPrintPreview(true)
        }}
      />

      <SickLeaveModal
        open={showSickLeaveModal}
        onClose={() => setShowSickLeaveModal(false)}
        onConfirm={(data) => {
          setSickLeaveData(data)
          setShowSickLeaveModal(false)
          setPrintType('sickleave')
          setShowPrintPreview(true)
        }}
      />

      <XRayRequestModal
        open={showXrayModal}
        onClose={() => setShowXrayModal(false)}
        onConfirm={(data) => {
          setXrayData(data)
          setShowXrayModal(false)
          setPrintType('xray')
          setShowPrintPreview(true)
        }}
      />

      {/* Modal لعرض بيانات الحساب الجديد مباشرة بعد الإنشاء التلقائي */}
      {newAccountInfo && (
        <NewAccountModal
          username={newAccountInfo.username}
          password={newAccountInfo.password}
          patientName={patient?.fullName ?? ''}
          lang={lang}
          onClose={() => setNewAccountInfo(null)}
        />
      )}
    </div>
  )
}

/** Modal لعرض بيانات دخول المريض الجديد، مع نسخ وطباعة سريعة */
function NewAccountModal({
  username,
  password,
  patientName,
  lang,
  onClose,
}: {
  username: string
  password: string
  patientName: string
  lang: 'ar' | 'en'
}) {
  const isAr = lang === 'ar'
  const [copiedField, setCopiedField] = useState<'user' | 'pass' | 'all' | null>(null)
  const copy = (text: string, field: 'user' | 'pass' | 'all') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }
  return (
    <Modal open onClose={onClose} size="md" title={
      isAr ? `تم إنشاء حساب ${patientName}` : `Account created for ${patientName}`
    }>
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          {isAr
            ? 'تم إنشاء الحساب تلقائياً. يُرجى تسليم البيانات للمريض أو ولي الأمر والاحتفاظ بها في السجلات. يمكن إعادة تعيين كلمة السر لاحقاً من صفحة المريض.'
            : 'The account was created automatically. Please hand the credentials to the patient or guardian and keep them in your records. Password can be reset later from the patient page.'}
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {isAr ? 'اسم المستخدم' : 'Username'}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="text-sm font-bold text-[var(--text)]" dir="ltr">{username}</code>
              <Button size="sm" variant="ghost" onClick={() => copy(username, 'user')}>
                {copiedField === 'user' ? (isAr ? 'تم' : 'Copied') : <><Copy className="h-3 w-3" /></>}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {isAr ? 'كلمة المرور' : 'Password'}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="text-sm font-bold text-[var(--text)]" dir="ltr">{password}</code>
              <Button size="sm" variant="ghost" onClick={() => copy(password, 'pass')}>
                {copiedField === 'pass' ? (isAr ? 'تم' : 'Copied') : <><Copy className="h-3 w-3" /></>}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="primary"
            onClick={() => copy(`${username}\t${password}`, 'all')}
            leftIcon={<Copy className="h-3.5 w-3.5" />}
          >
            {copiedField === 'all' ? (isAr ? 'تم نسخ الاثنين' : 'Both copied') : (isAr ? 'نسخ الاثنين' : 'Copy both')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {isAr ? 'حسناً' : 'Got it'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * السجل الطبي الشامل - معايير طبية عالمية
 */
function MedicalRecordTab({ patient, lang }: { patient: any; lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar'
  const Section = ({ icon, title, children, toneClass = 'blue' }: any) => {
    const tones: Record<string, string> = {
      rose: 'bg-rose-500/10 text-rose-500',
      blue: 'bg-blue-500/10 text-blue-500',
      violet: 'bg-violet-500/10 text-violet-500',
      emerald: 'bg-emerald-500/10 text-emerald-500',
      amber: 'bg-amber-500/10 text-amber-500',
      teal: 'bg-teal-500/10 text-teal-500',
    }
    return (
      <Card padding="md" className="h-full">
        <div className="mb-3 flex items-center gap-2">
          <div className={`grid h-8 w-8 place-items-center rounded-lg ${tones[toneClass] || tones.blue}`}>
            {icon}
          </div>
          <h3 className="text-sm font-semibold">{isAr ? title.ar : title.en}</h3>
        </div>
        <div className="text-xs">{children}</div>
      </Card>
    )
  }

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Allergies */}
      <StaggerItem>
        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title={{ ar: 'الحساسية', en: 'Allergies' }}
          toneClass="rose"
        >
          {patient.allergiesDetailed && patient.allergiesDetailed.length > 0 ? (
            <div className="space-y-2">
              {patient.allergiesDetailed.map((a: any, i: number) => (
                <div key={i} className="rounded-lg border border-rose-200/50 bg-rose-500/5 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{a.substance}</span>
                    <Badge tone={a.severity === 'life-threatening' ? 'danger' : a.severity === 'severe' ? 'warning' : 'info'}>
                      {a.severity}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--text-2)]">
                    {isAr ? 'التفاعل: ' : 'Reaction: '}{a.reaction}
                  </div>
                </div>
              ))}
            </div>
          ) : patient.allergies ? (
            <p className="text-[var(--text-2)]">{patient.allergies}</p>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'لا توجد حساسية معروفة' : 'No known allergies'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* Birth History */}
      <StaggerItem>
        <Section
          icon={<Baby className="h-4 w-4" />}
          title={{ ar: 'سوابق الولادة', en: 'Birth History' }}
          toneClass="blue"
        >
          {patient.birthHistory ? (
            <div className="space-y-1.5">
              {patient.birthHistory.gestationalAgeWeeks && (
                <Row label={isAr ? 'عمر الحمل' : 'Gestational age'} value={`${patient.birthHistory.gestationalAgeWeeks} ${isAr ? 'أسبوع' : 'weeks'}`} />
              )}
              {patient.birthHistory.birthWeightKg && (
                <Row label={isAr ? 'الوزن عند الولادة' : 'Birth weight'} value={`${patient.birthHistory.birthWeightKg} kg`} />
              )}
              {patient.birthHistory.birthLengthCm && (
                <Row label={isAr ? 'الطول عند الولادة' : 'Birth length'} value={`${patient.birthHistory.birthLengthCm} cm`} />
              )}
              {patient.birthHistory.deliveryType && (
                <Row label={isAr ? 'نوع الولادة' : 'Delivery type'} value={patient.birthHistory.deliveryType} />
              )}
              {patient.birthHistory.apgarScore1 && (
                <Row label={isAr ? 'أبغار 1د' : 'Apgar 1min'} value={String(patient.birthHistory.apgarScore1)} />
              )}
              {patient.birthHistory.apgarScore5 && (
                <Row label={isAr ? 'أبغار 5د' : 'Apgar 5min'} value={String(patient.birthHistory.apgarScore5)} />
              )}
              {patient.birthHistory.breastfeedingDuration && (
                <Row label={isAr ? 'مدة الرضاعة' : 'Breastfeeding'} value={patient.birthHistory.breastfeedingDuration} />
              )}
              {patient.birthHistory.complications && (
                <div className="mt-2 rounded-md border border-amber-200/50 bg-amber-500/5 p-2 text-[11px]">
                  <strong>{isAr ? 'مضاعفات: ' : 'Complications: '}</strong>{patient.birthHistory.complications}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'لم تسجل' : 'Not recorded'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* Past Medical History */}
      <StaggerItem>
        <Section
          icon={<Heart className="h-4 w-4" />}
          title={{ ar: 'السوابق المرضية', en: 'Past Medical History' }}
          toneClass="rose"
        >
          {patient.pastMedicalHistory ? (
            <div className="space-y-2">
              {patient.pastMedicalHistory.chronicDiseases && patient.pastMedicalHistory.chronicDiseases.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {isAr ? 'أمراض مزمنة' : 'Chronic diseases'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {patient.pastMedicalHistory.chronicDiseases.map((c: string, i: number) => (
                      <Badge key={i} tone="danger">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {patient.pastMedicalHistory.previousSurgeries && patient.pastMedicalHistory.previousSurgeries.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {isAr ? 'العمليات السابقة' : 'Previous surgeries'}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {patient.pastMedicalHistory.previousSurgeries.map((s: any, i: number) => (
                      <div key={i} className="text-[11px]">• {s.name} ({s.date})</div>
                    ))}
                  </div>
                </div>
              )}
              {patient.pastMedicalHistory.regularMedications && patient.pastMedicalHistory.regularMedications.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {isAr ? 'أدوية دائمة' : 'Regular medications'}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {patient.pastMedicalHistory.regularMedications.map((m: any, i: number) => (
                      <div key={i} className="text-[11px]">• {m.name} - {m.dose} ({m.frequency})</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : patient.chronicConditions ? (
            <p className="text-[var(--text-2)]">{patient.chronicConditions}</p>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'سجل نظيف' : 'Clear history'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* Family History */}
      <StaggerItem>
        <Section
          icon={<Users className="h-4 w-4" />}
          title={{ ar: 'التاريخ العائلي', en: 'Family History' }}
          toneClass="violet"
        >
          {patient.familyHistory ? (
            <div className="space-y-1.5">
              {patient.familyHistory.consanguinity && (
                <Badge tone="warning">{isAr ? 'زواج أقارب' : 'Consanguinity'}</Badge>
              )}
              {patient.familyHistory.father?.conditions && patient.familyHistory.father.conditions.length > 0 && (
                <div>
                  <span className="text-[10px] text-[var(--text-3)]">{isAr ? 'الأب: ' : 'Father: '}</span>
                  <span className="text-[11px] font-semibold">{patient.familyHistory.father.conditions.join('، ')}</span>
                </div>
              )}
              {patient.familyHistory.mother?.conditions && patient.familyHistory.mother.conditions.length > 0 && (
                <div>
                  <span className="text-[10px] text-[var(--text-3)]">{isAr ? 'الأم: ' : 'Mother: '}</span>
                  <span className="text-[11px] font-semibold">{patient.familyHistory.mother.conditions.join('، ')}</span>
                </div>
              )}
              {patient.familyHistory.siblings?.conditions && patient.familyHistory.siblings.conditions.length > 0 && (
                <div>
                  <span className="text-[10px] text-[var(--text-3)]">{isAr ? 'الإخوة: ' : 'Siblings: '}</span>
                  <span className="text-[11px] font-semibold">{patient.familyHistory.siblings.conditions.join('، ')}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'لم يسجل' : 'Not recorded'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* Social History */}
      <StaggerItem>
        <Section
          icon={<GraduationCap className="h-4 w-4" />}
          title={{ ar: 'السوابق الاجتماعية', en: 'Social History' }}
          toneClass="emerald"
        >
          {patient.socialHistory ? (
            <div className="space-y-1.5">
              {patient.socialHistory.schoolGrade && (
                <Row label={isAr ? 'المرحلة الدراسية' : 'School grade'} value={patient.socialHistory.schoolGrade} />
              )}
              {patient.socialHistory.diet && (
                <Row label={isAr ? 'النظام الغذائي' : 'Diet'} value={patient.socialHistory.diet} />
              )}
              {patient.socialHistory.sleepPattern && (
                <Row label={isAr ? 'نمط النوم' : 'Sleep pattern'} value={patient.socialHistory.sleepPattern} />
              )}
              {patient.socialHistory.pets && (
                <Row label={isAr ? 'حيوانات أليفة' : 'Pets'} value={patient.socialHistory.pets} />
              )}
              {patient.socialHistory.smokingExposure && (
                <Badge tone="danger">{isAr ? 'تعرض للتدخين' : 'Smoking exposure'}</Badge>
              )}
            </div>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'لم يسجل' : 'Not recorded'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* ICD-10 Diagnoses */}
      <StaggerItem>
        <Section
          icon={<TrendingUp className="h-4 w-4" />}
          title={{ ar: 'تشخيصات ICD-10', en: 'ICD-10 Diagnoses' }}
          toneClass="amber"
        >
          {patient.icd10Diagnoses && patient.icd10Diagnoses.length > 0 ? (
            <div className="space-y-1.5">
              {patient.icd10Diagnoses.map((d: any, i: number) => (
                <div key={i} className="rounded-md border border-[var(--border)] bg-[var(--bg-2)]/40 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">{d.code}</span>
                    <Badge tone={d.status === 'active' ? 'danger' : d.status === 'chronic' ? 'warning' : 'success'}>
                      {d.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[11px]">{d.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'لا توجد تشخيصات' : 'No diagnoses'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* Growth Records */}
      <StaggerItem className="lg:col-span-2">
        <Section
          icon={<TrendingUp className="h-4 w-4" />}
          title={{ ar: 'سجل النمو (Percentiles WHO)', en: 'Growth Records (WHO percentiles)' }}
          toneClass="teal"
        >
          {patient.growthRecords && patient.growthRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase text-[var(--text-3)]">
                    <th className="py-1 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-1 text-start">{isAr ? 'العمر' : 'Age'}</th>
                    <th className="py-1 text-end">{isAr ? 'وزن' : 'Weight'}</th>
                    <th className="py-1 text-end">{isAr ? 'طول' : 'Height'}</th>
                    <th className="py-1 text-end">BMI</th>
                    <th className="py-1 text-end">{isAr ? 'محيط رأس' : 'Head'}</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.growthRecords.map((g: any, i: number) => (
                    <tr key={i} className="border-b border-[var(--border)]/40">
                      <td className="py-1.5">{g.date?.split('T')[0] || '-'}</td>
                      <td className="py-1.5">{g.ageMonths}m</td>
                      <td className="py-1.5 text-end tabular-nums">{g.weightKg}kg</td>
                      <td className="py-1.5 text-end tabular-nums">{g.heightCm}cm</td>
                      <td className="py-1.5 text-end tabular-nums">{g.bmi || '-'}</td>
                      <td className="py-1.5 text-end tabular-nums">{g.headCircumferenceCm ? `${g.headCircumferenceCm}cm` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--text-3)]">{isAr ? 'لا توجد قياسات نمو' : 'No growth records'}</p>
          )}
        </Section>
      </StaggerItem>

      {/* Developmental Milestones */}
      {patient.developmentalMilestones && patient.developmentalMilestones.length > 0 && (
        <StaggerItem className="lg:col-span-2">
          <Section
            icon={<Brain className="h-4 w-4" />}
            title={{ ar: 'المعالم التطورية', en: 'Developmental Milestones' }}
            toneClass="violet"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {patient.developmentalMilestones.map((m: any, i: number) => (
                <div key={i} className="rounded-md border border-[var(--border)] p-2">
                  <div className="flex items-center justify-between">
                    <Badge tone={m.status === 'achieved' ? 'success' : m.status === 'delayed' ? 'warning' : 'danger'}>
                      {m.status}
                    </Badge>
                    <span className="text-[10px] text-[var(--text-3)]">{m.domain}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold">{m.milestone}</div>
                  <div className="text-[10px] text-[var(--text-3)]">
                    {isAr ? 'متوقع: ' : 'Expected: '}{m.expectedAgeMonths}m
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </StaggerItem>
      )}

      {/* Insurance */}
      {patient.insurance && (
        <StaggerItem className="lg:col-span-2">
          <Section
            icon={<ShieldCheck className="h-4 w-4" />}
            title={{ ar: 'معلومات التأمين', en: 'Insurance' }}
            toneClass="emerald"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <div className="text-[10px] text-[var(--text-3)]">{isAr ? 'الشركة' : 'Provider'}</div>
                <div className="font-semibold">{patient.insurance.provider}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-3)]">{isAr ? 'رقم البوليصة' : 'Policy #'}</div>
                <div className="font-mono font-semibold">{patient.insurance.policyNumber}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-3)]">{isAr ? 'صالح حتى' : 'Valid until'}</div>
                <div className="font-semibold">{patient.insurance.validUntil}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-3)]">{isAr ? 'نسبة التغطية' : 'Coverage'}</div>
                <div className="font-semibold text-emerald-600">{patient.insurance.coveragePercent}%</div>
              </div>
            </div>
          </Section>
        </StaggerItem>
      )}
    </Stagger>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-2)]">{label}</span>
      <span className="font-semibold text-[var(--text)]">{value}</span>
    </div>
  )
}

/** شارة حالة المريض السريرية (HL7/FHIR-aligned) */
function ClinicalStatusBadge({ status, lang }: { status?: string; lang: 'ar' | 'en' }) {
  if (!status) return null
  const map: Record<string, { ar: string; en: string; tone: string }> = {
    active: { ar: 'نشط', en: 'Active', tone: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30' },
    inactive: { ar: 'غير نشط', en: 'Inactive', tone: 'bg-slate-500/10 text-slate-700 ring-slate-500/30' },
    'in-treatment': { ar: 'تحت العلاج', en: 'In treatment', tone: 'bg-blue-500/10 text-blue-700 ring-blue-500/30' },
    'follow-up': { ar: 'متابعة', en: 'Follow-up', tone: 'bg-amber-500/10 text-amber-700 ring-amber-500/30' },
    discharged: { ar: 'خرج', en: 'Discharged', tone: 'bg-violet-500/10 text-violet-700 ring-violet-500/30' },
    referred: { ar: 'محوَّل', en: 'Referred', tone: 'bg-cyan-500/10 text-cyan-700 ring-cyan-500/30' },
    deceased: { ar: 'متوفى', en: 'Deceased', tone: 'bg-slate-700/10 text-slate-900 ring-slate-700/30' },
  }
  const m = map[status]
  if (!m) return null
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1', m.tone)}>
      {lang === 'ar' ? m.ar : m.en}
    </span>
  )
}

/** شارة مستوى الخطورة */
function RiskLevelBadge({ level, lang }: { level?: string; lang: 'ar' | 'en' }) {
  if (!level) return null
  const map: Record<string, { ar: string; en: string; tone: string }> = {
    low: { ar: 'منخفض', en: 'Low', tone: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30' },
    moderate: { ar: 'متوسط', en: 'Moderate', tone: 'bg-amber-500/10 text-amber-700 ring-amber-500/30' },
    high: { ar: 'مرتفع', en: 'High', tone: 'bg-orange-500/10 text-orange-700 ring-orange-500/30' },
    critical: { ar: 'حرج', en: 'Critical', tone: 'bg-rose-500/10 text-rose-700 ring-rose-500/30' },
  }
  const m = map[level]
  if (!m) return null
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1', m.tone)}>
      <AlertCircle className="h-3 w-3" />
      {lang === 'ar' ? m.ar : m.en}
    </span>
  )
}

/**
 * تبويب "الدور والحالة" — كل ما يهم المريض:
 *   - حجز دور جديد
 *   - موقعه في الدور ووقت الانتظار المتوقع
 *   - حالته السريرية ومستوى الخطورة
 *   - فريق الرعاية وجهات اتصال الطوارئ
 *   - تفضيلات التواصل + سجل الاتصالات
 *   - العلامات الحيوية الأساسية
 */
function PatientQueueStatusTab({
  patient,
  queueEntry,
  position,
  onAddToQueue,
  onUpdateStatus,
  onRemove,
  lang,
}: {
  patient: any
  queueEntry: any
  position: number
  onAddToQueue: (priority: 'normal' | 'urgent' | 'emergency') => void
  onUpdateStatus: (s: any) => void
  onRemove: () => void
  lang: 'ar' | 'en'
}) {
  const isAr = lang === 'ar'
  const updatePatient = usePatientsStore((s) => s.updatePatient)
  const [showAddModal, setShowAddModal] = useState(false)
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal')

  const waitMin = queueEntry
    ? Math.max(0, Math.round((Date.now() - new Date(queueEntry.arrivedAt).getTime()) / 60000))
    : 0
  const activeStatuses = ['waiting', 'in-progress', 'paused']
  const isActive = queueEntry && activeStatuses.includes(queueEntry.status)

  return (
    <div className="space-y-4">
      {/* ====== كارت الدور الحالي ====== */}
      <FadeIn>
        <Card
          padding="md"
          className={cn(
            'border-2',
            queueEntry?.status === 'in-progress' && 'border-emerald-500/50 bg-emerald-500/5',
            queueEntry?.status === 'waiting' && 'border-amber-500/40 bg-amber-500/5',
            !isActive && 'border-dashed border-blue-300/50'
          )}
        >
          {isActive ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-lg',
                      queueEntry.priority === 'emergency' && 'bg-rose-500 shadow-rose-500/30',
                      queueEntry.priority === 'urgent' && 'bg-amber-500 shadow-amber-500/30',
                      queueEntry.priority === 'normal' && 'bg-blue-500 shadow-blue-500/30'
                    )}
                  >
                    <span className="text-xl font-bold">#{queueEntry.number}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {queueEntry.status === 'in-progress'
                          ? isAr
                            ? '🔬 جارٍ الكشف'
                            : '🔬 In consultation'
                          : queueEntry.status === 'paused'
                          ? isAr
                            ? '⏸ متوقف مؤقتاً'
                            : '⏸ Paused'
                          : isAr
                          ? '⏳ في الانتظار'
                          : '⏳ Waiting'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-2)]">
                      {queueEntry.status === 'in-progress' && queueEntry.startedAt ? (
                        <span>
                          {isAr ? 'بدأ الكشف منذ ' : 'Started '}
                          <strong className="text-[var(--text)]">
                            {Math.round((Date.now() - new Date(queueEntry.startedAt).getTime()) / 60000)}{' '}
                            {isAr ? 'دقيقة' : 'min ago'}
                          </strong>
                        </span>
                      ) : (
                        <span>
                          {isAr ? 'انتظار: ' : 'Waiting: '}
                          <strong className="text-[var(--text)]">{waitMin}</strong> {isAr ? 'د' : 'm'}
                          {position > 0 && (
                            <>
                              {' • '}
                              {isAr ? 'الموقع: ' : 'Position: '}
                              <strong className="text-[var(--text)]">#{position}</strong>
                              {queueEntry.estimatedWaitMin !== undefined && waitMin === 0 && (
                                <>
                                  {' • '}
                                  <span className="text-blue-600">
                                    {isAr ? `متوقع: ${queueEntry.estimatedWaitMin} د` : `Est: ${queueEntry.estimatedWaitMin} m`}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {queueEntry.status === 'waiting' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onUpdateStatus('in-progress')}
                      leftIcon={<Activity className="h-3.5 w-3.5" />}
                    >
                      {isAr ? 'بدء الكشف' : 'Start'}
                    </Button>
                  )}
                  {queueEntry.status === 'in-progress' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateStatus('paused')}
                        leftIcon={<Pause className="h-3.5 w-3.5" />}
                      >
                        {isAr ? 'إيقاف' : 'Pause'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateStatus('done')}
                        leftIcon={<Check className="h-3.5 w-3.5" />}
                      >
                        {isAr ? 'إنهاء' : 'Done'}
                      </Button>
                    </>
                  )}
                  {queueEntry.status === 'paused' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onUpdateStatus('in-progress')}
                    >
                      {isAr ? 'استئناف' : 'Resume'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const ok = await confirm({
                        title: isAr ? 'حذف من الدور؟' : 'Remove from queue?',
                        description: isAr
                          ? 'سيتم إزالة المريض من قائمة الدور الحالية.'
                          : 'This will remove the patient from the current queue.',
                        confirmText: isAr ? 'حذف' : 'Remove',
                        cancelText: t.cancel,
                        tone: 'warning',
                      })
                      if (ok) onRemove()
                    }}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    {isAr ? 'حذف' : 'Remove'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                  <ListOrdered className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {isAr ? 'لا يوجد دور نشط' : 'No active queue'}
                  </div>
                  <div className="text-[11px] text-[var(--text-2)]">
                    {isAr ? 'احجز دوراً للمريض ليبدأ الكشف' : 'Book a turn to start consultation'}
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddModal(true)}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                {isAr ? 'حجز دور جديد' : 'Book new turn'}
              </Button>
            </div>
          )}
        </Card>
      </FadeIn>

      {showAddModal && (
        <Modal
          open={true}
          onClose={() => setShowAddModal(false)}
          title={isAr ? 'حجز دور' : 'Book turn'}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onAddToQueue(priority)
                  setShowAddModal(false)
                }}
              >
                {isAr ? 'تأكيد الحجز' : 'Confirm'}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
                {isAr ? 'الأولوية' : 'Priority'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'urgent', 'emergency'] as const).map((p) => {
                  const meta = {
                    normal: { ar: 'عادي', en: 'Normal', tone: 'border-slate-300' },
                    urgent: { ar: 'عاجل', en: 'Urgent', tone: 'border-amber-400' },
                    emergency: { ar: 'طارئ', en: 'Emergency', tone: 'border-rose-400' },
                  }[p]
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        'rounded-lg border-2 p-2 text-xs font-semibold transition',
                        priority === p
                          ? `${meta.tone} bg-blue-50 ring-2 ring-blue-500/30`
                          : 'border-[var(--border)] hover:border-blue-300'
                      )}
                    >
                      {isAr ? meta.ar : meta.en}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ====== الحالة السريرية + الخطورة ====== */}
      <FadeIn delay={0.05}>
        <Card padding="md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {isAr ? 'الحالة السريرية' : 'Clinical Status'}
            </h3>
            <ClinicalStatusBadge status={patient.clinicalStatus} lang={lang} />
            <RiskLevelBadge level={patient.riskLevel} lang={lang} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['active', 'in-treatment', 'follow-up', 'discharged'] as const).map((s) => {
              const label = {
                active: isAr ? 'نشط' : 'Active',
                'in-treatment': isAr ? 'تحت العلاج' : 'In treatment',
                'follow-up': isAr ? 'متابعة' : 'Follow-up',
                discharged: isAr ? 'خرج' : 'Discharged',
              }[s]
              return (
                <button
                  key={s}
                  onClick={() => updatePatient(patient.id, { clinicalStatus: s })}
                  className={cn(
                    'rounded-lg border p-2 text-[11px] font-semibold transition',
                    patient.clinicalStatus === s
                      ? 'border-blue-500 bg-blue-500/10 text-blue-700'
                      : 'border-[var(--border)] hover:border-blue-300'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div className="mt-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
              {isAr ? 'مستوى الخطورة' : 'Risk level'}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'moderate', 'high', 'critical'] as const).map((r) => {
                const label = {
                  low: isAr ? 'منخفض' : 'Low',
                  moderate: isAr ? 'متوسط' : 'Moderate',
                  high: isAr ? 'مرتفع' : 'High',
                  critical: isAr ? 'حرج' : 'Critical',
                }[r]
                const toneActive = {
                  low: 'border-emerald-500 bg-emerald-500/10 text-emerald-700',
                  moderate: 'border-amber-500 bg-amber-500/10 text-amber-700',
                  high: 'border-orange-500 bg-orange-500/10 text-orange-700',
                  critical: 'border-rose-500 bg-rose-500/10 text-rose-700',
                }[r]
                return (
                  <button
                    key={r}
                    onClick={() => updatePatient(patient.id, { riskLevel: r })}
                    className={cn(
                      'rounded-lg border p-1.5 text-[11px] font-semibold transition',
                      patient.riskLevel === r
                        ? toneActive
                        : 'border-[var(--border)] hover:border-blue-300'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* ====== فريق الرعاية ====== */}
      <FadeIn delay={0.08}>
        <Card padding="md">
          <h3 className="mb-3 text-sm font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            {isAr ? 'فريق الرعاية' : 'Care Team'}
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {isAr ? 'الطبيب الرئيسي' : 'Primary doctor'}
              </div>
              <Select
                value={patient.careTeam?.primaryDoctorId || ''}
                onChange={(e) =>
                  updatePatient(patient.id, {
                    careTeam: { ...patient.careTeam, primaryDoctorId: e.target.value || undefined },
                  })
                }
              >
                <option value="">{isAr ? '— لم يُحدد —' : '— Unassigned —'}</option>
                {useAuthStore.getState().users
                  .filter((u) => u.role === 'doctor' || u.role === 'admin')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {isAr ? 'الطبيب المُحوِّل' : 'Referring doctor'}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                  placeholder={isAr ? 'الاسم' : 'Name'}
                  value={patient.careTeam?.referringDoctor?.name || ''}
                  onChange={(e) =>
                    updatePatient(patient.id, {
                      careTeam: {
                        ...patient.careTeam,
                        referringDoctor: {
                          ...patient.careTeam?.referringDoctor,
                          name: e.target.value,
                        } as any,
                      },
                    })
                  }
                />
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                  placeholder={isAr ? 'الهاتف' : 'Phone'}
                  value={patient.careTeam?.referringDoctor?.phone || ''}
                  onChange={(e) =>
                    updatePatient(patient.id, {
                      careTeam: {
                        ...patient.careTeam,
                        referringDoctor: {
                          ...patient.careTeam?.referringDoctor,
                          phone: e.target.value,
                        } as any,
                      },
                    })
                  }
                />
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"
                  placeholder={isAr ? 'العيادة' : 'Clinic'}
                  value={patient.careTeam?.referringDoctor?.clinic || ''}
                  onChange={(e) =>
                    updatePatient(patient.id, {
                      careTeam: {
                        ...patient.careTeam,
                        referringDoctor: {
                          ...patient.careTeam?.referringDoctor,
                          clinic: e.target.value,
                        } as any,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* ====== جهات اتصال الطوارئ ====== */}
      <FadeIn delay={0.1}>
        <Card padding="md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {isAr ? 'جهات اتصال الطوارئ' : 'Emergency contacts'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const contacts = patient.emergencyContacts || []
                updatePatient(patient.id, {
                  emergencyContacts: [
                    ...contacts,
                    { name: '', relation: '', phone: '', isPrimary: contacts.length === 0 },
                  ],
                })
              }}
              leftIcon={<Plus className="h-3 w-3" />}
            >
              {isAr ? 'إضافة' : 'Add'}
            </Button>
          </div>
          {(patient.emergencyContacts || []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-3 text-center text-xs text-[var(--text-3)]">
              {isAr ? 'لا توجد جهات اتصال طوارئ' : 'No emergency contacts yet'}
            </div>
          ) : (
            <div className="space-y-2">
              {patient.emergencyContacts.map((c: any, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2 sm:grid-cols-4"
                >
                  <input
                    className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
                    placeholder={isAr ? 'الاسم' : 'Name'}
                    value={c.name}
                    onChange={(e) => {
                      const arr = [...patient.emergencyContacts]
                      arr[i] = { ...c, name: e.target.value }
                      updatePatient(patient.id, { emergencyContacts: arr })
                    }}
                  />
                  <input
                    className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
                    placeholder={isAr ? 'صلة القرابة' : 'Relation'}
                    value={c.relation}
                    onChange={(e) => {
                      const arr = [...patient.emergencyContacts]
                      arr[i] = { ...c, relation: e.target.value }
                      updatePatient(patient.id, { emergencyContacts: arr })
                    }}
                  />
                  <input
                    className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm"
                    placeholder={isAr ? 'الهاتف' : 'Phone'}
                    value={c.phone}
                    onChange={(e) => {
                      const arr = [...patient.emergencyContacts]
                      arr[i] = { ...c, phone: e.target.value }
                      updatePatient(patient.id, { emergencyContacts: arr })
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[10px]">
                      <input
                        type="checkbox"
                        checked={!!c.isPrimary}
                        onChange={(e) => {
                          const arr = patient.emergencyContacts.map((x: any, j: number) => ({
                            ...x,
                            isPrimary: j === i ? e.target.checked : false,
                          }))
                          updatePatient(patient.id, { emergencyContacts: arr })
                        }}
                      />
                      {isAr ? 'رئيسي' : 'Primary'}
                    </label>
                    <button
                      onClick={() =>
                        updatePatient(patient.id, {
                          emergencyContacts: patient.emergencyContacts.filter(
                            (_: any, j: number) => j !== i
                          ),
                        })
                      }
                      className="ms-auto rounded p-1 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </FadeIn>

      {/* ====== تفضيلات التواصل ====== */}
      <FadeIn delay={0.12}>
        <Card padding="md">
          <h3 className="mb-3 text-sm font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {isAr ? 'تفضيلات التواصل' : 'Communication preferences'}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {isAr ? 'القناة المفضلة' : 'Preferred channel'}
              </div>
              <Select
                value={patient.communicationPrefs?.preferredChannel || 'phone'}
                onChange={(e) =>
                  updatePatient(patient.id, {
                    communicationPrefs: {
                      ...(patient.communicationPrefs || {
                        preferredLanguage: 'ar',
                        allowSmsReminders: true,
                        allowWhatsapp: true,
                      }),
                      preferredChannel: e.target.value as any,
                    },
                  })
                }
              >
                <option value="phone">📞 {isAr ? 'هاتف' : 'Phone'}</option>
                <option value="sms">💬 SMS</option>
                <option value="whatsapp">📱 WhatsApp</option>
                <option value="email">📧 Email</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {isAr ? 'اللغة المفضلة' : 'Preferred language'}
              </div>
              <Select
                value={patient.communicationPrefs?.preferredLanguage || 'ar'}
                onChange={(e) =>
                  updatePatient(patient.id, {
                    communicationPrefs: {
                      ...(patient.communicationPrefs || {
                        preferredChannel: 'phone',
                        allowSmsReminders: true,
                        allowWhatsapp: true,
                      }),
                      preferredLanguage: e.target.value as any,
                    },
                  })
                }
              >
                <option value="ar">🇸🇦 العربية</option>
                <option value="en">🇬🇧 English</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={patient.communicationPrefs?.allowSmsReminders ?? true}
                  onChange={(e) =>
                    updatePatient(patient.id, {
                      communicationPrefs: {
                        ...(patient.communicationPrefs || {
                          preferredChannel: 'phone',
                          preferredLanguage: 'ar',
                          allowWhatsapp: true,
                        }),
                        allowSmsReminders: e.target.checked,
                      },
                    })
                  }
                />
                {isAr ? 'السماح بتذكيرات SMS' : 'Allow SMS reminders'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={patient.communicationPrefs?.allowWhatsapp ?? true}
                  onChange={(e) =>
                    updatePatient(patient.id, {
                      communicationPrefs: {
                        ...(patient.communicationPrefs || {
                          preferredChannel: 'phone',
                          preferredLanguage: 'ar',
                          allowSmsReminders: true,
                        }),
                        allowWhatsapp: e.target.checked,
                      },
                    })
                  }
                />
                {isAr ? 'السماح بـ WhatsApp' : 'Allow WhatsApp'}
              </label>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* ====== العلامات الحيوية ====== */}
      <FadeIn delay={0.14}>
        <Card padding="md">
          <h3 className="mb-3 text-sm font-bold flex items-center gap-2">
            <HeartPulse className="h-4 w-4" />
            {isAr ? 'العلامات الحيوية' : 'Vital signs'}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <VitalInput
              label={isAr ? 'الحرارة °C' : 'Temp °C'}
              value={patient.baselineVitals?.temperatureC}
              onChange={(v) =>
                updatePatient(patient.id, {
                  baselineVitals: { ...patient.baselineVitals, temperatureC: v },
                })
              }
            />
            <VitalInput
              label={isAr ? 'النبض/د' : 'HR bpm'}
              value={patient.baselineVitals?.heartRateBpm}
              onChange={(v) =>
                updatePatient(patient.id, {
                  baselineVitals: { ...patient.baselineVitals, heartRateBpm: v },
                })
              }
            />
            <VitalInput
              label={isAr ? 'التنفس/د' : 'RR'}
              value={patient.baselineVitals?.respiratoryRate}
              onChange={(v) =>
                updatePatient(patient.id, {
                  baselineVitals: { ...patient.baselineVitals, respiratoryRate: v },
                })
              }
            />
            <VitalInput
              label={isAr ? 'SpO₂ %' : 'SpO₂ %'}
              value={patient.baselineVitals?.oxygenSaturation}
              onChange={(v) =>
                updatePatient(patient.id, {
                  baselineVitals: { ...patient.baselineVitals, oxygenSaturation: v },
                })
              }
            />
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}

function VitalInput({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
        {label}
      </div>
      <input
        type="number"
        step="0.1"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm font-semibold tabular-nums"
      />
    </div>
  )
}

/**
 * بطاقة إدارة حساب المريض في البوابة الإلكترونية
 * - إنشاء حساب تلقائي (بطلب الطاقم) وعرض البيانات
 * - إعادة تعيين كلمة السر
 * - نسخ سريع للبيانات
 */
function PatientAccountCard({
  patientId,
  fullName,
  birthDate,
  getPatientAccount,
  createPatientAccount,
  resetPatientPassword,
  lang,
}: {
  patientId: string
  fullName: string
  birthDate?: string
  getPatientAccount: (id: string) => any
  createPatientAccount: (id: string, name: string, bd: string) => any
  resetPatientPassword: (id: string) => string | null
  lang: 'ar' | 'en'
}) {
  const isAr = lang === 'ar'
  const confirm = useConfirm()
  const account = getPatientAccount(patientId)
  const [revealed, setRevealed] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pendingResult, setPendingResult] = useState<{ username: string; password: string } | null>(null)

  const copy = (text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  const handleCreate = () => {
    const result = createPatientAccount(patientId, fullName, birthDate || '')
    setPendingResult({ username: result.user.username, password: result.generatedPassword })
    setShowCreateModal(false)
  }

  const handleReset = async () => {
    if (!account) return
    const ok = await confirm({
      title: isAr ? 'إعادة تعيين كلمة السر؟' : 'Reset password?',
      description: isAr
        ? 'سيتم توليد كلمة سر جديدة. تأكد من إبلاغ المريض أو ولي الأمر بالكلمة الجديدة.'
        : 'A new password will be generated. Make sure to inform the patient or guardian of the new password.',
      confirmText: isAr ? 'إعادة تعيين' : 'Reset',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      tone: 'warning',
    })
    if (ok) {
      const np = resetPatientPassword(patientId)
      if (np) {
        setNewPassword(np)
        toast.success(isAr ? 'تم إعادة تعيين كلمة السر' : 'Password reset successfully')
      }
    }
  }

  if (!account) {
    return (
      <Card padding="md" className="border-dashed border-2 border-blue-300/60 bg-blue-50/30">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {isAr ? 'حساب البوابة الإلكترونية' : 'Patient portal account'}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--text-2)]">
                {isAr
                  ? 'لم يُنشأ لهذا المريض حساب بعد. أنشئ حسابه ليطّلع على ملفه عبر التطبيق.'
                  : 'This patient has no portal account yet. Create one so they can access their file via the app.'}
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<KeyRound className="h-3.5 w-3.5" />}
          >
            {isAr ? 'إنشاء حساب + طباعة البيانات' : 'Create account + print credentials'}
          </Button>
        </div>

        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={isAr ? 'تأكيد إنشاء الحساب' : 'Confirm account creation'}
        >
          <div className="space-y-3 text-sm">
            <p>
              {isAr
                ? `سيتم إنشاء حساب بوابة إلكترونية للمريض "${fullName}" باسم مستخدم فريد وكلمة سر مؤلفة من 6 أرقام. ستظهر البيانات تلقائياً في الفاتورة المطبوعة.`
                : `A portal account will be created for "${fullName}" with a unique username and a 6-digit password. The credentials will appear on the printed invoice.`}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleCreate}>
                {isAr ? 'تأكيد' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Modal>

        {pendingResult && (
          <CredentialsAlert
            username={pendingResult.username}
            password={pendingResult.password}
            isAr={isAr}
            onClose={() => setPendingResult(null)}
          />
        )}
      </Card>
    )
  }

  // عند وجود حساب مسبق
  const displayPassword = newPassword || account.password
  return (
    <Card padding="md" className="border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-50/30 to-blue-50/30">
      <div className="mb-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              {isAr ? 'حساب البوابة الإلكترونية — فعّال' : 'Patient portal account — Active'}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--text-2)]">
              {isAr
                ? 'يُمكن للمريض الدخول بهذه البيانات عبر بوابة المرضى ليرى ملفه ومواعيده وفواتيره.'
                : 'The patient can use these credentials to log in and see their file, appointments and invoices.'}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          leftIcon={<RotateCw className="h-3.5 w-3.5" />}
        >
          {isAr ? 'إعادة تعيين كلمة السر' : 'Reset password'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-blue-200 bg-white p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {isAr ? 'اسم المستخدم' : 'Username'}
          </div>
          <div className="flex items-center justify-between gap-2">
            <code className="font-mono text-sm font-bold text-slate-900" dir="ltr">
              {account.username}
            </code>
            <button
              onClick={() => copy(account.username)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              title={isAr ? 'نسخ' : 'Copy'}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {isAr ? 'كلمة المرور' : 'Password'}
            </span>
            <button
              onClick={() => setRevealed((v) => !v)}
              className="text-[10px] font-semibold text-blue-600 hover:underline"
            >
              {revealed ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Reveal')}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <code className="font-mono text-sm font-bold text-emerald-700" dir="ltr">
              {revealed ? displayPassword : '••••••'}
            </code>
            <button
              onClick={() => copy(displayPassword)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              title={isAr ? 'نسخ' : 'Copy'}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {newPassword && (
            <div className="mt-1 text-[10px] italic text-emerald-600">
              {isAr ? 'كلمة سر جديدة — انسخها واطبعها' : 'New password — copy & print it'}
            </div>
          )}
        </div>
      </div>

      {newPassword && (
        <div className="mt-3 rounded-md border-2 border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          <strong>{isAr ? '⚠ تنبيه: ' : '⚠ Note: '}</strong>
          {isAr
            ? 'تم تغيير كلمة السر. تأكد من طباعة البيانات الجديدة وتسليمها للمريض، فهي لن تُعرض كاملة مرة أخرى.'
            : 'Password was changed. Make sure to print and hand the new credentials to the patient — it will not be shown in full again.'}
        </div>
      )}

      {pendingResult && (
        <CredentialsAlert
          username={pendingResult.username}
          password={pendingResult.password}
          isAr={isAr}
          onClose={() => setPendingResult(null)}
        />
      )}
    </Card>
  )
}

function CredentialsAlert({
  username,
  password,
  isAr,
  onClose,
}: {
  username: string
  password: string
  isAr: boolean
  onClose: () => void
}) {
  return (
    <div className="mt-3 rounded-lg border-2 border-emerald-400 bg-emerald-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <KeyRound className="h-4 w-4" />
        {isAr ? 'بيانات الدخول الجديدة' : 'New credentials'}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded border border-emerald-300 bg-white p-2">
          <div className="text-[10px] text-slate-500">{isAr ? 'اسم المستخدم' : 'Username'}</div>
          <div className="font-mono font-bold" dir="ltr">{username}</div>
        </div>
        <div className="rounded border border-emerald-300 bg-white p-2">
          <div className="text-[10px] text-slate-500">{isAr ? 'كلمة المرور' : 'Password'}</div>
          <div className="font-mono font-bold text-emerald-700" dir="ltr">{password}</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] italic text-emerald-800">
        {isAr
          ? 'اطبع الفاتورة أو الوصفة الآن لتحمل هذه البيانات في أسفلها.'
          : 'Print the invoice or prescription now to embed these credentials at the bottom.'}
      </div>
      <button onClick={onClose} className="mt-2 text-[11px] text-emerald-700 hover:underline">
        {isAr ? 'إخفاء' : 'Dismiss'}
      </button>
    </div>
  )
}
