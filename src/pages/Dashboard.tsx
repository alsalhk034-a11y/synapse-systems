import { motion } from 'framer-motion'
import {
  Users,
  CalendarDays,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  Plus,
  Stethoscope,
  Receipt,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
  Syringe,
  Bell,
  FileText,
  ChevronRight,
  Zap,
  Heart,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/stores/authStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useExamsStore } from '@/stores/examsStore'
import { useVaccinesStore } from '@/stores/vaccinesStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Avatar, PatientBadge } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Stagger, StaggerItem } from '@/components/ui/Motion'
import { formatCurrency, formatTime, formatAge, formatRelative } from '@/lib/format'
import { CURRENCY_SYMBOLS, type Currency } from '@/types/invoice'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { t, lang } = useTranslation()
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()
  const patients = usePatientsStore((s) => s.patients)
  const appointments = useAppointmentsStore((s) => s.appointments)
  const invoices = useInvoicesStore((s) => s.invoices)
  const exams = useExamsStore((s) => s.exams)
  const vaccines = useVaccinesStore((s) => s.vaccines)
  const currency = useSettingsStore((s) => s.clinic.currency)

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const todayAppts = appointments
    .filter((a) => {
      const d = new Date(a.scheduledAt)
      return d >= todayStart && d < todayEnd
    })
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))

  const todayRevenue = invoices
    .filter((i) => {
      const d = new Date(i.createdAt)
      return d >= todayStart && d < todayEnd
    })
    .reduce((s, i) => s + i.paid, 0)

  const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'partial').length
  const overdueVaccines = vaccines.filter((v) => {
    if (!v.nextDueDate) return false
    return new Date(v.nextDueDate) < today
  }).length
  const todayVaccines = vaccines.filter((v) => {
    if (!v.nextDueDate) return false
    const d = new Date(v.nextDueDate)
    return d >= todayStart && d < todayEnd
  }).length

  const upcoming = todayAppts.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').slice(0, 5)

  const greeting = (() => {
    const h = today.getHours()
    if (lang === 'ar') return h < 17 ? t.goodMorning : t.goodEvening
    return h < 17 ? t.goodMorning : t.goodEvening
  })()

  const recentPatients = [...patients]
    .filter((p) => p.lastVisitAt)
    .sort((a, b) => +new Date(b.lastVisitAt!) - +new Date(a.lastVisitAt!))
    .slice(0, 5)

  const statusCounts = {
    completed: todayAppts.filter((a) => a.status === 'completed').length,
    waiting: todayAppts.filter((a) => a.status === 'waiting' || a.status === 'in_progress').length,
    scheduled: todayAppts.filter((a) => a.status === 'scheduled').length,
  }

  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - (6 - i))
    const dEnd = new Date(d)
    dEnd.setDate(d.getDate() + 1)
    return {
      day: d.toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US', { weekday: 'short' }),
      count: appointments.filter((a) => {
        const ad = new Date(a.scheduledAt)
        return ad >= d && ad < dEnd
      }).length,
    }
  })
  const maxWeek = Math.max(...weekly.map((w) => w.count), 1)

  // Smart reminders
  const reminders = [
    overdueVaccines > 0 && {
      icon: Syringe,
      tone: 'danger' as const,
      title: lang === 'ar' ? `${overdueVaccines} لقاحات متأخرة` : `${overdueVaccines} overdue vaccines`,
      description: lang === 'ar' ? 'مراجعة اللقاحات المتأخرة وتذكير الأهالي' : 'Review overdue vaccines and notify parents',
      action: () => navigate('/exams'),
    },
    pendingInvoices > 0 && {
      icon: Wallet,
      tone: 'warning' as const,
      title: lang === 'ar' ? `${pendingInvoices} فواتير معلقة` : `${pendingInvoices} pending invoices`,
      description: lang === 'ar' ? 'تحصيل المبالغ المستحقة' : 'Collect outstanding payments',
      action: () => navigate('/invoices'),
    },
    todayAppts.length > 0 && statusCounts.waiting > 0 && {
      icon: Clock,
      tone: 'info' as const,
      title: lang === 'ar' ? `${statusCounts.waiting} مرضى في الانتظار` : `${statusCounts.waiting} patients waiting`,
      description: lang === 'ar' ? 'بدء الكشف معهم الآن' : 'Start their exams now',
      action: () => navigate('/appointments'),
    },
    todayVaccines > 0 && {
      icon: Bell,
      tone: 'primary' as const,
      title: lang === 'ar' ? `${todayVaccines} لقاحات اليوم` : `${todayVaccines} vaccines today`,
      description: lang === 'ar' ? 'تذكير الأهالي بالمواعيد' : 'Remind parents of appointments',
      action: () => navigate('/exams'),
    },
  ].filter(Boolean) as Array<{ icon: any; tone: string; title: string; description: string; action: () => void }>

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {greeting}, {currentUser?.fullName.split(' ').slice(0, 1).join(' ')} <span className="inline-block animate-[wave_1.6s_ease-in-out_infinite] origin-[70%_70%]">👋</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {lang === 'ar'
              ? `لديك ${todayAppts.length} ${todayAppts.length === 1 ? 'موعد' : 'مواعيد'} اليوم.`
              : `You have ${todayAppts.length} appointment${todayAppts.length === 1 ? '' : 's'} today.`}
          </p>
        </div>
      </motion.div>

      {/* Quick Action Buttons (Big & Clear) */}
      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: t.newPatient,
            sublabel: lang === 'ar' ? 'سجل بيانات جديدة' : 'Register new data',
            icon: Users,
            to: '/patients/new',
            gradient: 'from-blue-600 via-blue-500 to-cyan-500',
            shortcut: 'Ctrl+N',
          },
          {
            label: lang === 'ar' ? 'بدء كشف' : 'Start exam',
            sublabel: lang === 'ar' ? 'للمريض الحالي' : 'For current patient',
            icon: Stethoscope,
            to: '/exams',
            gradient: 'from-violet-600 via-violet-500 to-fuchsia-500',
            shortcut: 'Ctrl+E',
          },
          {
            label: lang === 'ar' ? 'فاتورة سريعة' : 'Quick invoice',
            sublabel: lang === 'ar' ? 'إنشاء فاتورة' : 'Create invoice',
            icon: Receipt,
            to: '/invoices/new',
            gradient: 'from-teal-600 via-emerald-500 to-green-500',
            shortcut: 'Ctrl+I',
          },
          {
            label: t.newAppointment,
            sublabel: lang === 'ar' ? 'جدولة موعد' : 'Schedule appointment',
            icon: CalendarDays,
            to: '/appointments',
            gradient: 'from-amber-500 via-orange-500 to-rose-500',
            shortcut: 'G A',
          },
        ].map((a, i) => (
          <StaggerItem key={i}>
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(a.to)}
              className="group relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-start shadow-soft transition-all hover:shadow-glow"
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-5', a.gradient)} />
              <div className={cn('mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft', a.gradient)}>
                <a.icon className="h-5.5 w-5.5" strokeWidth={2.2} />
              </div>
              <div className="text-sm font-bold text-[var(--text)]">{a.label}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{a.sublabel}</div>
              <div className="mt-2 flex items-center justify-between">
                <kbd className="rounded border border-[var(--border)] bg-[var(--bg-2)] px-1.5 py-0.5 text-[9px] font-mono text-[var(--text-3)]">
                  {a.shortcut}
                </kbd>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-3)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </div>
            </motion.button>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Smart Reminders */}
      {reminders.length > 0 && (
        <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {reminders.map((r, i) => (
            <StaggerItem key={i}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                onClick={r.action}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-all',
                  r.tone === 'danger' && 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10',
                  r.tone === 'warning' && 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
                  r.tone === 'info' && 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
                  r.tone === 'primary' && 'border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10'
                )}
              >
                <div
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                    r.tone === 'danger' && 'bg-rose-500/15 text-rose-500',
                    r.tone === 'warning' && 'bg-amber-500/15 text-amber-500',
                    r.tone === 'info' && 'bg-blue-500/15 text-blue-500',
                    r.tone === 'primary' && 'bg-violet-500/15 text-violet-500'
                  )}
                >
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[var(--text)]">
                    {r.title}
                  </div>
                  <div className="truncate text-[10px] text-[var(--text-2)]">
                    {r.description}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-3)] rtl:rotate-180" />
              </motion.button>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Stat Cards */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t.todaysAppointments,
            value: todayAppts.length,
            icon: CalendarDays,
            tone: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10 text-blue-500',
            to: '/appointments',
          },
          {
            label: t.todaysPatients,
            value: new Set(todayAppts.map((a) => a.patientId)).size,
            icon: Users,
            tone: 'from-violet-500 to-purple-500',
            bg: 'bg-violet-500/10 text-violet-500',
            to: '/patients',
          },
          {
            label: t.todaysRevenue,
            value: todayRevenue,
            icon: Wallet,
            tone: 'from-teal-500 to-emerald-500',
            bg: 'bg-teal-500/10 text-teal-500',
            to: '/invoices',
            isCurrency: true,
          },
          {
            label: t.pendingTasks,
            value: pendingInvoices + statusCounts.waiting,
            icon: AlertCircle,
            tone: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-500/10 text-amber-500',
            to: '/invoices',
          },
        ].map((s, i) => (
          <StaggerItem key={i}>
            <Card hover onClick={() => navigate(s.to)} className="cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${s.bg}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-3)]">
                    {s.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)]">
                    {s.isCurrency ? (
                      <span>
                        <AnimatedNumber value={s.value} />{' '}
                        <span className="text-sm font-normal text-[var(--text-2)]">
                          {CURRENCY_SYMBOLS[currency]}
                        </span>
                      </span>
                    ) : (
                      <AnimatedNumber value={s.value} />
                    )}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--text-3)] opacity-0 transition-opacity group-hover:opacity-100 rtl:rotate-180" />
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming appointments */}
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title={t.upcomingAppointments}
            description={lang === 'ar' ? 'قائمة المواعيد القادمة لليوم' : "Today's upcoming queue"}
            icon={<CalendarDays className="h-4 w-4" />}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
                {lang === 'ar' ? 'عرض الكل' : 'View all'}
                <ArrowUpRight className="ms-1 h-3 w-3 rtl:rotate-180" />
              </Button>
            }
          />
          <div className="mt-4 space-y-2">
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-3)]">
                {t.noUpcoming}
              </div>
            ) : (
              upcoming.map((a) => {
                const patient = patients.find((p) => p.id === a.patientId)
                if (!patient) return null
                const statusTone = {
                  scheduled: 'info' as const,
                  waiting: 'warning' as const,
                  in_progress: 'primary' as const,
                  completed: 'success' as const,
                  cancelled: 'danger' as const,
                  no_show: 'neutral' as const,
                }[a.status]
                return (
                  <motion.button
                    key={a.id}
                    onClick={() => navigate('/patients/' + patient.id)}
                    whileHover={{ x: lang === 'ar' ? -4 : 4 }}
                    className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-start transition-all hover:border-[var(--primary-2)]/40 hover:shadow-soft"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary-2)]">
                      {formatTime(a.scheduledAt, lang)}
                    </div>
                    <PatientBadge
                      name={patient.fullName}
                      age={formatAge(patient.birthDate, lang)}
                      gender={patient.gender}
                    />
                    <div className="ms-auto flex items-center gap-2">
                      <Badge tone={statusTone}>
                        {String(t[`status${a.status.charAt(0).toUpperCase() + a.status.slice(1).replace('_', '')}` as keyof typeof t] ?? a.status)}
                      </Badge>
                      <span className="hidden text-[11px] text-[var(--text-3)] md:inline">
                        {a.reason}
                      </span>
                    </div>
                  </motion.button>
                )
              })
            )}
          </div>
        </Card>

        {/* Status */}
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader title={t.todayOverview} icon={<Activity className="h-4 w-4" />} />
            <div className="mt-4 space-y-3">
              {[
                { label: t.statusCompleted, value: statusCounts.completed, color: 'bg-teal-500', total: todayAppts.length || 1 },
                { label: t.statusWaiting, value: statusCounts.waiting, color: 'bg-amber-500', total: todayAppts.length || 1 },
                { label: t.statusScheduled, value: statusCounts.scheduled, color: 'bg-blue-500', total: todayAppts.length || 1 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-2)]">{row.label}</span>
                    <span className="font-semibold text-[var(--text)]">{row.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-2)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.value / row.total) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', row.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Weekly + Recent */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title={t.weeklyOverview}
            description={lang === 'ar' ? 'المواعيد خلال آخر 7 أيام' : 'Appointments over the last 7 days'}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <div className="mt-5 flex h-40 items-end gap-2">
            {weekly.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="text-[10px] font-medium text-[var(--text-3)]">{d.count}</div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxWeek) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-500/30 to-violet-500/80 min-h-[6px]"
                />
                <div className="text-[10px] font-medium text-[var(--text-2)]">{d.day}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader
            title={t.recentPatients}
            description={lang === 'ar' ? 'آخر الزيارات' : 'Last visits'}
            icon={<Clock className="h-4 w-4" />}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
                {lang === 'ar' ? 'الكل' : 'All'}
              </Button>
            }
          />
          <div className="mt-4 space-y-2.5">
            {recentPatients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--text-3)]">
                {t.noData}
              </div>
            ) : (
              recentPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate('/patients/' + p.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-start transition-colors hover:bg-[var(--bg-2)]"
                >
                  <Avatar name={p.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-[var(--text)]">
                      {p.fullName}
                    </div>
                    <div className="truncate text-[10px] text-[var(--text-3)]">
                      {formatRelative(p.lastVisitAt!, lang)}
                    </div>
                  </div>
                  <ArrowUpRight className="h-3 w-3 text-[var(--text-3)] rtl:rotate-180" />
                </button>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
