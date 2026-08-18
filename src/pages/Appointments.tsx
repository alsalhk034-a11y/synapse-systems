import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  ListChecks,
  CalendarRange,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuditStore } from '@/stores/auditStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Avatar, PatientBadge } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn } from '@/components/ui/Motion'
import { generateId } from '@/lib/utils'
import { formatTime } from '@/lib/format'
import type { AppointmentStatus } from '@/types/appointment'
import { cn } from '@/lib/utils'
import {
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  format,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

type View = 'week' | 'day' | 'list'

export function AppointmentsPage() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const appointments = useAppointmentsStore((s) => s.appointments)
  const addAppointment = useAppointmentsStore((s) => s.addAppointment)
  const updateStatus = useAppointmentsStore((s) => s.updateStatus)
  const patients = usePatientsStore((s) => s.patients)
  const users = useAuthStore((s) => s.users)
  const log = useAuditStore((s) => s.log)
  const user = useAuthStore((s) => s.currentUser)

  const [view, setView] = useState<View>('week')
  const [refDate, setRefDate] = useState(new Date())
  const [openNew, setOpenNew] = useState(params.get('new') === '1')
  const [newForm, setNewForm] = useState({
    patientId: '',
    doctorId: users.find((u) => u.role === 'doctor')?.id ?? '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    durationMin: 20,
    reason: '',
  })

  const weekStart = startOfWeek(refDate, { weekStartsOn: 6 }) // Saturday
  const weekEnd = endOfWeek(refDate, { weekStartsOn: 6 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filtered = useMemo(() => {
    if (view === 'day') {
      return appointments
        .filter((a) => isSameDay(new Date(a.scheduledAt), refDate))
        .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    }
    if (view === 'week') {
      return appointments
        .filter((a) => {
          const d = new Date(a.scheduledAt)
          return d >= weekStart && d <= weekEnd
        })
        .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    }
    return [...appointments].sort(
      (a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt)
    )
  }, [appointments, view, refDate, weekStart, weekEnd])

  const onCreate = () => {
    if (!newForm.patientId || !newForm.doctorId) return
    const scheduledAt = new Date(`${newForm.date}T${newForm.time}:00`).toISOString()
    const created = addAppointment({
      patientId: newForm.patientId,
      doctorId: newForm.doctorId,
      scheduledAt,
      durationMin: newForm.durationMin,
      status: 'scheduled' as AppointmentStatus,
      reason: newForm.reason,
    })
    log({
      userId: user?.id ?? 'unknown',
      userName: user?.fullName ?? 'unknown',
      action: 'create_appointment',
      entityType: 'appointment',
      entityId: created.id,
      details: { patientId: newForm.patientId },
    })
    setOpenNew(false)
    setParams({})
    setNewForm((f) => ({ ...f, patientId: '', reason: '' }))
  }

  const onUpdateStatus = (id: string, status: AppointmentStatus) => {
    updateStatus(id, status)
    log({
      userId: user?.id ?? 'unknown',
      userName: user?.fullName ?? 'unknown',
      action: 'update_appointment',
      entityType: 'appointment',
      entityId: id,
      details: { status },
    })
  }

  const goToday = () => setRefDate(new Date())
  const goPrev = () => setRefDate(view === 'week' ? subWeeks(refDate, 1) : addDays(refDate, -1))
  const goNext = () => setRefDate(view === 'week' ? addWeeks(refDate, 1) : addDays(refDate, 1))

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.appointments}</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              {lang === 'ar' ? `${filtered.length} موعد` : `${filtered.length} appointments`}
              {' • '}
              {view === 'week'
                ? `${format(weekStart, 'dd MMM', { locale: lang === 'ar' ? ar : enUS })} — ${format(weekEnd, 'dd MMM yyyy', { locale: lang === 'ar' ? ar : enUS })}`
                : format(refDate, 'EEEE, dd MMMM yyyy', { locale: lang === 'ar' ? ar : enUS })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
              {(
                [
                  { v: 'week' as View, l: t.weekView, icon: CalendarRange },
                  { v: 'day' as View, l: t.dayView, icon: CalIcon },
                  { v: 'list' as View, l: t.listView, icon: ListChecks },
                ]
              ).map((vv) => (
                <button
                  key={vv.v}
                  onClick={() => setView(vv.v)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    view === vv.v
                      ? 'bg-[var(--bg-2)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  )}
                >
                  <vv.icon className="h-3.5 w-3.5" />
                  {vv.l}
                </button>
              ))}
            </div>
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenNew(true)}>
              {t.newAppointmentTitle}
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Date nav */}
      {view !== 'list' && (
        <FadeIn>
          <Card padding="sm" className="!p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={goPrev}>
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToday}>
                  {t.today}
                </Button>
                <Button variant="ghost" size="icon" onClick={goNext}>
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Views */}
      {view === 'week' && (
        <FadeIn>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
            {days.map((d) => {
              const dayAppts = appointments
                .filter((a) => isSameDay(new Date(a.scheduledAt), d))
                .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
              const isToday = isSameDay(d, new Date())
              return (
                <div
                  key={d.toISOString()}
                  className={cn(
                    'surface flex flex-col rounded-2xl p-3 transition-all',
                    isToday && 'ring-2 ring-[var(--primary-2)]/40'
                  )}
                >
                  <div className="mb-2 flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                        {format(d, 'EEE', { locale: lang === 'ar' ? ar : enUS })}
                      </div>
                      <div className={cn('text-xl font-bold', isToday && 'text-[var(--primary-2)]')}>
                        {format(d, 'dd')}
                      </div>
                    </div>
                    {dayAppts.length > 0 && (
                      <Badge tone="primary">{dayAppts.length}</Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {dayAppts.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[var(--border)] py-3 text-center text-[10px] text-[var(--text-3)]">
                        —
                      </div>
                    )}
                    {dayAppts.slice(0, 4).map((a) => {
                      const p = patients.find((pp) => pp.id === a.patientId)
                      if (!p) return null
                      const tone = {
                        scheduled: 'info' as const,
                        waiting: 'warning' as const,
                        in_progress: 'primary' as const,
                        completed: 'success' as const,
                        cancelled: 'danger' as const,
                        no_show: 'neutral' as const,
                      }[a.status]
                      return (
                        <button
                          key={a.id}
                          onClick={() => navigate('/patients/' + p.id)}
                          className="group flex w-full items-start gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 text-start transition-all hover:border-[var(--primary-2)]/40 hover:shadow-soft"
                        >
                          <div className="grid h-6 w-9 shrink-0 place-items-center rounded bg-[var(--primary)]/10 text-[9px] font-bold text-[var(--primary-2)]">
                            {formatTime(a.scheduledAt, lang)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-semibold">{p.fullName}</div>
                            <Badge tone={tone} className="!text-[8px] !px-1 !py-0">
                              {t[`status${a.status.charAt(0).toUpperCase() + a.status.slice(1).replace('_', '')}` as keyof typeof t] as string}
                            </Badge>
                          </div>
                        </button>
                      )
                    })}
                    {dayAppts.length > 4 && (
                      <div className="text-center text-[10px] text-[var(--text-3)]">
                        +{dayAppts.length - 4} {lang === 'ar' ? 'أكثر' : 'more'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </FadeIn>
      )}

      {view === 'day' && (
        <DayView
          date={refDate}
          appts={filtered}
          onStatus={onUpdateStatus}
        />
      )}

      {view === 'list' && (
        <FadeIn>
          {filtered.length === 0 ? (
            <EmptyState
              size="lg"
              tone="primary"
              title={t.noAppointments}
              description={
                lang === 'ar'
                  ? 'لم يتم جدولة أي مواعيد في هذا اليوم. أنشئ موعداً جديداً لتنظيم عيادتك.'
                  : 'No appointments scheduled for this day. Create a new appointment to organize your clinic.'
              }
              icon={<CalIcon />}
              action={
                <Button
                  variant="primary"
                  onClick={() => setOpenNew(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {t.newAppointment}
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => {
                const p = patients.find((pp) => pp.id === a.patientId)
                if (!p) return null
                const tone = {
                  scheduled: 'info' as const,
                  waiting: 'warning' as const,
                  in_progress: 'primary' as const,
                  completed: 'success' as const,
                  cancelled: 'danger' as const,
                  no_show: 'neutral' as const,
                }[a.status]
                return (
                  <Card key={a.id} padding="sm" className="!p-3" hover>
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary-2)]">
                        {formatTime(a.scheduledAt, lang)}
                      </div>
                      <PatientBadge name={p.fullName} />
                      <div className="hidden text-xs text-[var(--text-2)] md:block">{a.reason}</div>
                      <Badge tone={tone}>
                        {t[`status${a.status.charAt(0).toUpperCase() + a.status.slice(1).replace('_', '')}` as keyof typeof t] as string}
                      </Badge>
                      <div className="ms-auto flex items-center gap-1">
                        {a.status === 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="subtle"
                              onClick={() => onUpdateStatus(a.id, 'waiting')}
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => navigate('/exams/' + p.id)}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {a.status === 'waiting' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => navigate('/exams/' + p.id)}
                          >
                            {t.newExam}
                          </Button>
                        )}
                        {(a.status === 'scheduled' || a.status === 'waiting') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUpdateStatus(a.id, 'cancelled')}
                            className="text-rose-500"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </FadeIn>
      )}

      {/* New Appointment Modal */}
      <Modal
        open={openNew}
        onClose={() => {
          setOpenNew(false)
          setParams({})
        }}
        title={t.newAppointmentTitle}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenNew(false)}>
              {t.cancel}
            </Button>
            <Button variant="primary" onClick={onCreate}>
              {t.save}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
              {t.patient}
            </label>
            <Select
              value={newForm.patientId}
              onChange={(e) => setNewForm((f) => ({ ...f, patientId: e.target.value }))}
            >
              <option value="">—</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — {p.phone}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
              {t.doctor2}
            </label>
            <Select
              value={newForm.doctorId}
              onChange={(e) => setNewForm((f) => ({ ...f, doctorId: e.target.value }))}
            >
              {users
                .filter((u) => u.role === 'doctor')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{t.date}</label>
              <Input
                type="date"
                value={newForm.date}
                onChange={(e) => setNewForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{t.time}</label>
              <Input
                type="time"
                value={newForm.time}
                onChange={(e) => setNewForm((f) => ({ ...f, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                {t.duration} ({t.minutes})
              </label>
              <Input
                type="number"
                value={newForm.durationMin}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, durationMin: Number(e.target.value) || 20 }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">{t.reason}</label>
              <Input
                value={newForm.reason}
                onChange={(e) => setNewForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder={lang === 'ar' ? 'كشف دوري، حرارة...' : 'Checkup, fever...'}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DayView({
  date,
  appts,
  onStatus,
}: {
  date: Date
  appts: ReturnType<typeof useAppointmentsStore.getState>['appointments']
  onStatus: (id: string, s: AppointmentStatus) => void
}) {
  const { t, lang } = useTranslation()
  const patients = usePatientsStore((s) => s.patients)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20

  return (
    <Card padding="md">
      <div className="space-y-1.5">
        {hours.map((h) => {
          const slotAppts = appts.filter((a) => new Date(a.scheduledAt).getHours() === h)
          return (
            <div key={h} className="flex gap-3 border-t border-[var(--border)] py-2 first:border-t-0">
              <div className="w-12 shrink-0 pt-1 text-xs font-semibold text-[var(--text-3)]">
                {String(h).padStart(2, '0')}:00
              </div>
              <div className="flex-1 space-y-1.5">
                {slotAppts.length === 0 ? (
                  <div className="h-6" />
                ) : (
                  slotAppts.map((a) => {
                    const p = patients.find((pp) => pp.id === a.patientId)
                    if (!p) return null
                    const tone = {
                      scheduled: 'info' as const,
                      waiting: 'warning' as const,
                      in_progress: 'primary' as const,
                      completed: 'success' as const,
                      cancelled: 'danger' as const,
                      no_show: 'neutral' as const,
                    }[a.status]
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5"
                      >
                        <div className="grid h-8 w-12 shrink-0 place-items-center rounded-md bg-[var(--primary)]/10 text-[10px] font-bold text-[var(--primary-2)]">
                          {formatTime(a.scheduledAt, lang)}
                        </div>
                        <PatientBadge name={p.fullName} size="sm" />
                        <div className="hidden text-xs text-[var(--text-2)] md:block">{a.reason}</div>
                        <Badge tone={tone} className="ms-auto">
                          {t[`status${a.status.charAt(0).toUpperCase() + a.status.slice(1).replace('_', '')}` as keyof typeof t] as string}
                        </Badge>
                        <div className="flex gap-1">
                          {a.status === 'scheduled' && (
                            <Button size="sm" variant="subtle" onClick={() => onStatus(a.id, 'waiting')}>
                              {t.statusWaiting}
                            </Button>
                          )}
                          {a.status === 'waiting' && (
                            <Button size="sm" variant="primary" onClick={() => onStatus(a.id, 'in_progress')}>
                              {t.statusInProgress}
                            </Button>
                          )}
                          {a.status === 'in_progress' && (
                            <Button size="sm" variant="primary" onClick={() => onStatus(a.id, 'completed')}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
