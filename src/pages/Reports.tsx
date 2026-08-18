import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  CalendarDays,
  Wallet,
  TrendingUp,
  Activity,
  Pill,
  Cake,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useExamsStore } from '@/stores/examsStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Stagger, StaggerItem, FadeIn } from '@/components/ui/Motion'
import { CURRENCY_SYMBOLS, type Currency } from '@/types/invoice'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ReportsPage() {
  const { t, lang } = useTranslation()
  const patients = usePatientsStore((s) => s.patients)
  const appointments = useAppointmentsStore((s) => s.appointments)
  const invoices = useInvoicesStore((s) => s.invoices)
  const exams = useExamsStore((s) => s.exams)
  const currency = useSettingsStore((s) => s.clinic.currency)

  const totalRevenue = invoices.reduce((s, i) => s + i.paid, 0)
  const pendingRevenue = invoices.reduce((s, i) => s + (i.total - i.paid), 0)
  const completedAppts = appointments.filter((a) => a.status === 'completed').length
  const cancelledAppts = appointments.filter((a) => a.status === 'cancelled').length
  const completionRate = appointments.length
    ? Math.round((completedAppts / appointments.length) * 100)
    : 0

  // Age distribution
  const ageGroups = useMemo(() => {
    const groups = { '0-1': 0, '1-3': 0, '3-6': 0, '6-12': 0, '12+': 0 }
    for (const p of patients) {
      const age = (Date.now() - +new Date(p.birthDate)) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 1) groups['0-1']++
      else if (age < 3) groups['1-3']++
      else if (age < 6) groups['3-6']++
      else if (age < 12) groups['6-12']++
      else groups['12+']++
    }
    return groups
  }, [patients])
  const maxAge = Math.max(...Object.values(ageGroups), 1)

  // Top diagnoses
  const topDiagnoses = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of exams) {
      const key = e.diagnosis.split(/[،,.;.]/)[0].trim()
      if (key) map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [exams])

  // Monthly revenue (last 6 months)
  const monthly = useMemo(() => {
    const months: { label: string; value: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const value = invoices
        .filter((inv) => {
          const dt = new Date(inv.createdAt)
          return dt >= d && dt < dEnd
        })
        .reduce((s, i) => s + i.paid, 0)
      months.push({
        label: d.toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US', { month: 'short' }),
        value,
      })
    }
    return months
  }, [invoices, lang])
  const maxMonth = Math.max(...monthly.map((m) => m.value), 1)

  return (
    <div className="space-y-5">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.reports}</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {lang === 'ar' ? 'نظرة شاملة على نشاط العيادة' : 'Comprehensive view of clinic activity'}
          </p>
        </div>
      </FadeIn>

      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t.totalPatients,
            value: patients.length,
            icon: Users,
            tone: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10 text-blue-500',
            suffix: '',
          },
          {
            label: t.totalAppointments,
            value: appointments.length,
            icon: CalendarDays,
            tone: 'from-violet-500 to-purple-500',
            bg: 'bg-violet-500/10 text-violet-500',
            suffix: '',
          },
          {
            label: t.totalRevenue,
            value: totalRevenue,
            icon: Wallet,
            tone: 'from-teal-500 to-emerald-500',
            bg: 'bg-teal-500/10 text-teal-500',
            suffix: ' ' + CURRENCY_SYMBOLS[currency],
            isCurrency: true,
          },
          {
            label: lang === 'ar' ? 'معدل الإنجاز' : 'Completion rate',
            value: completionRate,
            icon: TrendingUp,
            tone: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-500/10 text-amber-500',
            suffix: '%',
          },
        ].map((s, i) => (
          <StaggerItem key={i}>
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className={cn('grid h-10 w-10 place-items-center rounded-xl', s.bg)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {s.label}
                  </div>
                  <div className="text-lg font-bold">
                    <AnimatedNumber value={s.value} />
                    {s.suffix}
                  </div>
                </div>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Monthly revenue chart */}
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title={t.byMonth}
            description={lang === 'ar' ? 'آخر 6 أشهر' : 'Last 6 months'}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <div className="mt-5 flex h-56 items-end gap-3">
            {monthly.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[10px] font-semibold tabular-nums text-[var(--text-2)]">
                  {m.value > 0 ? Math.round(m.value / 1000) + 'k' : '—'}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.value / maxMonth) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-t-md bg-gradient-to-t from-blue-500/40 via-violet-500/60 to-teal-500/80 min-h-[8px]"
                />
                <div className="text-[10px] font-medium text-[var(--text-3)]">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
            <span className="text-[var(--text-2)]">
              {lang === 'ar' ? 'المعلق' : 'Pending'}
            </span>
            <span className="font-bold text-amber-600">
              {formatCurrency(pendingRevenue, currency, lang)}
            </span>
          </div>
        </Card>

        {/* Age distribution */}
        <Card padding="md">
          <CardHeader
            title={lang === 'ar' ? 'توزيع الأعمار' : 'Age distribution'}
            icon={<Cake className="h-4 w-4" />}
          />
          <div className="mt-4 space-y-3">
            {Object.entries(ageGroups).map(([range, count]) => (
              <div key={range}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-2)]">
                    {lang === 'ar' ? `${range} سنوات` : `${range} years`}
                  </span>
                  <span className="font-bold text-[var(--text)]">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-2)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxAge) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top diagnoses */}
        <Card padding="md">
          <CardHeader
            title={t.topDiagnoses}
            icon={<Pill className="h-4 w-4" />}
          />
          {topDiagnoses.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[var(--text-3)]">{t.noData}</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {topDiagnoses.map(([name, count], i) => {
                const max = topDiagnoses[0][1]
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--primary)]/10 text-[10px] font-bold text-[var(--primary-2)]">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate font-medium">{name}</span>
                        <span className="font-bold text-[var(--text-2)]">{count}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-2)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / max) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Appointment status breakdown */}
        <Card padding="md">
          <CardHeader title={t.byStatus} icon={<Activity className="h-4 w-4" />} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: t.statusCompleted, value: completedAppts, color: 'from-teal-500 to-emerald-500' },
              { label: t.statusCancelled, value: cancelledAppts, color: 'from-rose-500 to-pink-500' },
              {
                label: t.statusWaiting,
                value: appointments.filter((a) => a.status === 'waiting' || a.status === 'in_progress').length,
                color: 'from-amber-500 to-orange-500',
              },
              {
                label: t.statusScheduled,
                value: appointments.filter((a) => a.status === 'scheduled').length,
                color: 'from-blue-500 to-cyan-500',
              },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className={`mb-2 h-1 w-8 rounded-full bg-gradient-to-r ${s.color}`} />
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">{s.label}</div>
                <div className="mt-0.5 text-2xl font-bold">
                  <AnimatedNumber value={s.value} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
