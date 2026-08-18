/**
 * لوحة الدور — Queue / Turn Board
 * عرض حي للمرضى في الانتظار والجارين مع إمكانية:
 *   - إضافة مريض جديد للدور
 *   - استدعاء التالي
 *   - إنهاء/إيقاف/إلغاء
 *   - تغيير الأولوية
 *   - إحصائيات (متوسط الانتظار، متوسط الكشف، عدد المنتظرين)
 */
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Play,
  Check,
  X,
  Pause,
  ChevronRight,
  SkipForward,
  Trash2,
  Stethoscope,
  Clock,
  Activity,
  Bell,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useQueueStore, getQueuePosition, type QueuePriority } from '@/stores/queueStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/Motion'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

const PRIORITY_META: Record<QueuePriority, { label: string; labelEn: string; tone: string; ring: string }> = {
  emergency: { label: 'طارئ', labelEn: 'Emergency', tone: 'bg-rose-500', ring: 'ring-rose-500/40' },
  urgent: { label: 'عاجل', labelEn: 'Urgent', tone: 'bg-amber-500', ring: 'ring-amber-500/40' },
  normal: { label: 'عادي', labelEn: 'Normal', tone: 'bg-slate-400', ring: 'ring-slate-400/30' },
}

const STATUS_META = {
  waiting: { label: 'منتظر', labelEn: 'Waiting', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'in-progress': { label: 'جارٍ الكشف', labelEn: 'In progress', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  paused: { label: 'متوقف', labelEn: 'Paused', icon: Pause, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  done: { label: 'منتهي', labelEn: 'Done', icon: Check, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'no-show': { label: 'لم يحضر', labelEn: 'No show', icon: SkipForward, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  cancelled: { label: 'ملغى', labelEn: 'Cancelled', icon: X, color: 'text-slate-400', bg: 'bg-slate-400/10' },
} as const

export function QueuePage() {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const entries = useQueueStore((s) => s.entries)
  const addToQueue = useQueueStore((s) => s.addToQueue)
  const updateStatus = useQueueStore((s) => s.updateStatus)
  const setPriority = useQueueStore((s) => s.setPriority)
  const removeFromQueue = useQueueStore((s) => s.removeFromQueue)
  const callNext = useQueueStore((s) => s.callNext)
  const getCurrentlyServing = useQueueStore((s) => s.getCurrentlyServing)
  const getWaiting = useQueueStore((s) => s.getWaiting)
  const getFinished = useQueueStore((s) => s.getFinished)
  const clearFinished = useQueueStore((s) => s.clearFinished)
  const getAverageWaitMin = useQueueStore((s) => s.getAverageWaitMin)
  const getAverageConsultMin = useQueueStore((s) => s.getAverageConsultMin)
  const dailyCounter = useQueueStore((s) => s.dailyCounter)

  const patients = usePatientsStore((s) => s.patients)
  const currentUser = useAuthStore((s) => s.currentUser)
  const allUsers = useAuthStore((s) => s.users)
  const doctors = useMemo(
    () => allUsers.filter((u) => u.role === 'doctor' || u.role === 'admin'),
    [allUsers]
  )

  const [showAdd, setShowAdd] = useState(false)
  const [showFinished, setShowFinished] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [now, setNow] = useState(Date.now())

  // تحديث الوقت كل 30 ثانية
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const waiting = useMemo(() => {
    const all = getWaiting()
    return selectedDoctor === 'all'
      ? all
      : all.filter((e) => !e.doctorId || e.doctorId === selectedDoctor)
  }, [entries, selectedDoctor])

  const serving = getCurrentlyServing(selectedDoctor === 'all' ? undefined : selectedDoctor)
  const finished = getFinished()
  const stats = {
    waiting: waiting.length,
    done: finished.filter((e) => e.status === 'done').length,
    noShow: finished.filter((e) => e.status === 'no-show').length,
    servedToday: dailyCounter,
  }

  const handleCallNext = () => {
    const next = callNext(selectedDoctor === 'all' ? undefined : selectedDoctor)
    if (!next && waiting.length > 0) {
      // الجميع متوقفون، نحتاج بدء الأول
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAr ? 'لوحة الدور' : 'Queue Board'}
          </h1>
          <p className="text-sm text-[var(--text-2)]">
            {isAr
              ? 'إدارة مباشرة لأدوار المرضى اليوم — من حجز الدور حتى إنهاء الكشف'
              : 'Live patient queue management — from check-in to discharge'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFinished(true)}
            leftIcon={<Activity className="h-3.5 w-3.5" />}
            disabled={finished.length === 0}
          >
            {isAr ? `المنتهون (${finished.length})` : `Finished (${finished.length})`}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAdd(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            {isAr ? 'إضافة للدور' : 'Add to queue'}
          </Button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StaggerItem>
          <StatCard
            label={isAr ? 'في الانتظار' : 'Waiting'}
            value={stats.waiting}
            icon={Clock}
            tone="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={isAr ? 'جارٍ الكشف' : 'In progress'}
            value={serving ? 1 : 0}
            icon={Stethoscope}
            tone="emerald"
            highlight={!!serving}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={isAr ? 'منهون اليوم' : 'Done today'}
            value={stats.done}
            icon={Check}
            tone="blue"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={isAr ? 'لم يحضروا' : 'No-show'}
            value={stats.noShow}
            icon={SkipForward}
            tone="rose"
          />
        </StaggerItem>
      </Stagger>

      {/* تصفية بالأطباء + متوسط الأوقات */}
      <FadeIn>
        <Card padding="md">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--text-3)]" />
              <span className="text-sm font-semibold">
                {isAr ? 'تصفية بالطبيب:' : 'Filter by doctor:'}
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedDoctor('all')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition',
                    selectedDoctor === 'all'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
                  )}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                {doctors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDoctor(d.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition',
                      selectedDoctor === d.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]'
                    )}
                  >
                    {d.fullName}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-2)]">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {isAr ? 'متوسط الانتظار: ' : 'Avg wait: '}
                  <strong className="text-[var(--text)]">{getAverageWaitMin()}</strong>
                  {isAr ? ' د' : ' m'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>
                  {isAr ? 'متوسط الكشف: ' : 'Avg consult: '}
                  <strong className="text-[var(--text)]">{getAverageConsultMin()}</strong>
                  {isAr ? ' د' : ' m'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* الكشف الحالي */}
      {serving && (
        <FadeIn>
          <Card padding="md" className="border-2 border-emerald-500/40 bg-emerald-500/5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              {isAr ? 'جارٍ الكشف الآن' : 'Currently serving'}
            </div>
            <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-700">#{serving.number}</span>
                    <span className="text-base font-semibold">{serving.patientName}</span>
                    <Badge tone="success">{STATUS_META['in-progress'].label}</Badge>
                  </div>
                  <div className="text-xs text-[var(--text-2)]">
                    {serving.reason || (isAr ? 'بدون سبب محدد' : 'No specific reason')}
                    {serving.startedAt && (
                      <span className="ms-2">
                        • {isAr ? 'بدأ: ' : 'Started: '}
                        {formatRelative(serving.startedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateStatus(serving.id, 'paused')}
                  leftIcon={<Pause className="h-3.5 w-3.5" />}
                >
                  {isAr ? 'إيقاف' : 'Pause'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateStatus(serving.id, 'done')
                    callNext(selectedDoctor === 'all' ? undefined : selectedDoctor)
                  }}
                  leftIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  {isAr ? 'إنهاء واستدعاء التالي' : 'Finish & call next'}
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* قائمة المنتظرين */}
      <FadeIn>
        <Card padding="md">
          <CardHeader
            title={isAr ? `المنتظرون (${waiting.length})` : `Waiting (${waiting.length})`}
            icon={<Clock className="h-4 w-4" />}
            action={
              waiting.length > 0 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCallNext}
                  leftIcon={<Bell className="h-3.5 w-3.5" />}
                >
                  {isAr ? 'استدعاء التالي' : 'Call next'}
                </Button>
              ) : null
            }
          />
          <div className="mt-3 space-y-2">
            <AnimatePresence>
              {waiting.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={isAr ? 'لا يوجد منتظرون' : 'No one in the queue'}
                  description={isAr ? 'أضف مريضاً جديداً للدور' : 'Add a patient to the queue'}
                />
              ) : (
                waiting.map((e) => (
                  <QueueRow
                    key={e.id}
                    entry={e}
                    position={getQueuePosition(entries, e.id)}
                    onStart={() => updateStatus(e.id, 'in-progress')}
                    onCancel={() => updateStatus(e.id, 'cancelled')}
                    onRemove={() => removeFromQueue(e.id)}
                    onSetPriority={(p) => setPriority(e.id, p)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </Card>
      </FadeIn>

      {/* Modal إضافة للدور */}
      <AddToQueueModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => {
          // منطق الأولوية للطبيب:
          // 1) إذا اختار المستخدم طبيباً في المودال، استخدمه
          // 2) وإلا فالطبيب المُصفّى الحالي
          // 3) وإلا فلا شيء
          const finalDoctorId =
            data.doctorId || (selectedDoctor !== 'all' ? selectedDoctor : undefined)
          addToQueue({
            ...data,
            doctorId: finalDoctorId,
            createdBy: currentUser?.id,
          })
          setShowAdd(false)
        }}
        patients={patients}
        doctors={doctors}
        defaultDoctorId={selectedDoctor === 'all' ? undefined : selectedDoctor}
      />

      {/* Modal الأدوار المنتهية */}
      <Modal
        open={showFinished}
        onClose={() => setShowFinished(false)}
        title={isAr ? 'الأدوار المنتهية اليوم' : 'Today\'s finished queue'}
        size="lg"
        footer={
          finished.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearFinished} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
              {isAr ? 'مسح الكل' : 'Clear all'}
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {finished.length === 0 ? (
            <EmptyState icon={Activity} title={isAr ? 'لا يوجد' : 'Empty'} />
          ) : (
            finished.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', PRIORITY_META[e.priority].tone)} />
                  <span className="font-mono text-sm">#{e.number}</span>
                  <span className="font-medium">{e.patientName}</span>
                </div>
                <Badge
                  tone={
                    e.status === 'done'
                      ? 'primary'
                      : e.status === 'no-show'
                      ? 'danger'
                      : 'neutral'
                  }
                >
                  {STATUS_META[e.status].label}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  highlight,
}: {
  label: string
  value: number
  icon: any
  tone: 'amber' | 'emerald' | 'blue' | 'rose'
  highlight?: boolean
}) {
  const tones = {
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-600 ring-amber-500/30',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 ring-emerald-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-600 ring-blue-500/30',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-600 ring-rose-500/30',
  }
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'rounded-xl bg-gradient-to-br p-3 ring-1 transition',
        tones[tone],
        highlight && 'shadow-lg shadow-emerald-500/20'
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
    </motion.div>
  )
}

function QueueRow({
  entry,
  position,
  onStart,
  onCancel,
  onRemove,
  onSetPriority,
}: {
  entry: any
  position: number
  onStart: () => void
  onCancel: () => void
  onRemove: () => void
  onSetPriority: (p: QueuePriority) => void
}) {
  const { lang } = useTranslation()
  const isAr = lang === 'ar'
  const waitMin = Math.max(
    0,
    Math.round((Date.now() - new Date(entry.arrivedAt).getTime()) / 60000)
  )
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3',
        entry.priority === 'emergency' && 'ring-2 ring-rose-500/40 border-rose-300',
        entry.priority === 'urgent' && 'ring-1 ring-amber-500/30'
      )}
    >
      <div
        className={cn(
          'grid h-12 w-12 shrink-0 place-items-center rounded-lg text-white font-bold',
          PRIORITY_META[entry.priority].tone
        )}
      >
        #{entry.number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{entry.patientName}</span>
          <Badge
            tone={
              entry.priority === 'emergency'
                ? 'danger'
                : entry.priority === 'urgent'
                ? 'warning'
                : 'neutral'
            }
          >
            {PRIORITY_META[entry.priority].label}
          </Badge>
          {entry.painScore !== undefined && entry.painScore > 0 && (
            <Badge tone="danger">⚡ {entry.painScore}/10</Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-[var(--text-2)]">
          <span>
            {isAr ? 'موقعك: ' : 'Position: '}
            <strong className="text-[var(--text)]">#{position}</strong>
          </span>
          <span>
            {isAr ? 'انتظار: ' : 'Waiting: '}
            <strong className="text-[var(--text)]">{waitMin}</strong>
            {isAr ? ' د' : ' m'}
          </span>
          {entry.estimatedWaitMin !== undefined && waitMin === 0 && (
            <span className="text-blue-600">
              {isAr ? `متوقع: ${entry.estimatedWaitMin} د` : `Est: ${entry.estimatedWaitMin} m`}
            </span>
          )}
          {entry.reason && (
            <span className="truncate">• {entry.reason}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="primary"
          size="sm"
          onClick={onStart}
          leftIcon={<Play className="h-3 w-3" />}
        >
          {isAr ? 'كشف' : 'Start'}
        </Button>
        <select
          value={entry.priority}
          onChange={(e) => onSetPriority(e.target.value as QueuePriority)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
          title={isAr ? 'الأولوية' : 'Priority'}
        >
          <option value="emergency">🚨</option>
          <option value="urgent">⚡</option>
          <option value="normal">—</option>
        </select>
        <button
          onClick={onCancel}
          className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10"
          title={isAr ? 'إلغاء' : 'Cancel'}
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          title={isAr ? 'حذف' : 'Remove'}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function AddToQueueModal({
  open,
  onClose,
  onSubmit,
  patients,
  doctors,
  defaultDoctorId,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    patientId: string
    patientName: string
    doctorId?: string
    reason?: string
    priority: QueuePriority
    notes?: string
    painScore?: number
  }) => void
  patients: any[]
  doctors: any[]
  defaultDoctorId?: string
}) {
  const { lang } = useTranslation()
  const isAr = lang === 'ar'
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState(defaultDoctorId || '')
  const [reason, setReason] = useState('')
  const [priority, setPriority] = useState<QueuePriority>('normal')
  const [painScore, setPainScore] = useState(0)
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')

  // مزامنة الطبيب الافتراضي عند تغيّر الفلتر في الصفحة الرئيسية
  useEffect(() => {
    setDoctorId(defaultDoctorId || '')
  }, [defaultDoctorId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return patients
      .filter(
        (p) =>
          !q ||
          p.fullName.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.parentPhone?.toLowerCase().includes(q)
      )
      .slice(0, 10)
  }, [search, patients])

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === patientId)
    if (!patient) return
    onSubmit({
      patientId,
      patientName: patient.fullName,
      doctorId: doctorId || undefined,
      reason: reason || undefined,
      priority,
      painScore: painScore > 0 ? painScore : undefined,
      notes: notes || undefined,
    })
    setPatientId('')
    setReason('')
    setPriority('normal')
    setPainScore(0)
    setNotes('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAr ? 'إضافة مريض للدور' : 'Add patient to queue'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!patientId}>
            {isAr ? 'إضافة' : 'Add'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
            {isAr ? 'بحث عن مريض' : 'Search patient'}
          </label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'اسم، هاتف...' : 'Name, phone...'}
          />
          {search && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              {filtered.length === 0 ? (
                <div className="p-2 text-center text-xs text-[var(--text-3)]">
                  {isAr ? 'لا يوجد' : 'No results'}
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPatientId(p.id)
                      setSearch('')
                    }}
                    className={cn(
                      'flex w-full items-center justify-between p-2 text-start text-sm hover:bg-[var(--surface-2)]',
                      patientId === p.id && 'bg-blue-500/10'
                    )}
                  >
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-xs text-[var(--text-3)]">{p.phone}</span>
                  </button>
                ))
              )}
            </div>
          )}
          {patientId && (
            <div className="mt-1 rounded-lg border border-blue-300 bg-blue-50 p-2 text-xs">
              ✓ {patients.find((p) => p.id === patientId)?.fullName}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
              {isAr ? 'الطبيب' : 'Doctor'}
            </label>
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">{isAr ? 'بدون تحديد' : 'No specific doctor'}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
              {isAr ? 'الأولوية' : 'Priority'}
            </label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as QueuePriority)}>
              <option value="normal">{isAr ? 'عادي' : 'Normal'}</option>
              <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
              <option value="emergency">{isAr ? 'طارئ' : 'Emergency'}</option>
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
            {isAr ? 'سبب الزيارة' : 'Reason'}
          </label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={isAr ? 'متابعة، حرارة، سعال...' : 'Follow-up, fever, cough...'} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
            {isAr ? 'درجة الألم (0-10)' : 'Pain score (0-10)'}: <strong>{painScore}</strong>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">
            {isAr ? 'ملاحظات' : 'Notes'}
          </label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  )
}
