import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  User, Heart, Calendar, FileText, Syringe, Wallet, AlertCircle
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/stores/authStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useExamsStore } from '@/stores/examsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useVaccinesStore } from '@/stores/vaccinesStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, ageInMonths, ageInYears, formatMoney } from '@/lib/format'
import { Link } from 'react-router-dom'

export function PatientPortalPage() {
  const { t, lang } = useTranslation()
  const isAr = lang === 'ar'
  const user = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)
  const hasPerm = useAuthStore((s) => s.hasPermission)
  const patients = usePatientsStore((s) => s.patients)
  const appointments = useAppointmentsStore((s) => s.appointments)
  const exams = useExamsStore((s) => s.exams)
  const invoices = useInvoicesStore((s) => s.invoices)
  const vaccines = useVaccinesStore((s) => s.vaccines)

  const patient = useMemo(() => {
    if (!user) return null
    if (user.role !== 'patient') return null
    // أمان: يجب أن يكون للمريض linkedPatientId صريح.
    // إن لم يوجد، لا نطابق بالاسم (فهذا يعرّض البيانات لأي مريض).
    if (!user.linkedPatientId) {
      console.warn('Patient account has no linkedPatientId:', user.username)
      return null
    }
    return patients.find((p) => p.id === user.linkedPatientId) ?? null
  }, [user, patients])

  if (!user || (user.role !== 'patient' && !hasPerm('portal.view_own'))) {
    return (
      <div className="surface mx-auto max-w-md p-8 text-center">
        <User className="mx-auto h-12 w-12 text-[var(--text-3)]" />
        <h2 className="mt-3 text-xl font-bold">{isAr ? 'بوابة المريض' : 'Patient Portal'}</h2>
        <p className="mt-2 text-sm text-[var(--text-3)]">
          {isAr ? 'هذه الصفحة للمرضى فقط. سجل دخول بحسابك للمتابعة.' : 'This page is for patients. Sign in with your account.'}
        </p>
        <Link to="/login" className="mt-4 inline-block rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white">
          {t.login}
        </Link>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="surface mx-auto max-w-md p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-3 text-xl font-bold">{isAr ? 'لم يتم ربط حسابك بمريض' : 'Account not linked to patient'}</h2>
        <p className="mt-2 text-sm text-[var(--text-3)]">
          {isAr ? 'تواصل مع العيادة لربط حسابك بملفك الطبي.' : 'Please contact the clinic to link your account.'}
        </p>
      </div>
    )
  }

  const myAppointments = appointments.filter((a) => a.patientId === patient.id)
  const myExams = exams.filter((e) => e.patientId === patient.id).sort((a, b) => b.examDate.localeCompare(a.examDate))
  const myInvoices = invoices.filter((i) => i.patientId === patient.id)
  const myVaccines = vaccines.filter((v) => v.patientId === patient.id)
  const totalDue = myInvoices.reduce((s, i) => s + (i.total - i.paid), 0)

  const ageM = ageInMonths(patient.birthDate)
  const ageY = ageInYears(patient.birthDate)
  const ageStr = ageY >= 2 ? `${ageY} ${isAr ? 'سنة' : 'y'}` : `${ageM} ${isAr ? 'شهر' : 'm'}`

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 p-6 text-white shadow-xl"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/30" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/20" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-md">
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{isAr ? 'مرحباً' : 'Welcome'}</div>
            <h1 className="text-2xl font-bold">{patient.fullName}</h1>
            <div className="mt-1 text-xs opacity-90">
              {patient.mrn} • {ageStr} • {patient.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}
            </div>
          </div>
          <button onClick={logout} className="ms-auto rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-md hover:bg-white/30">
            {t.logout}
          </button>
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox icon={Calendar} label={isAr ? 'مواعيدي' : 'Appointments'} value={myAppointments.length} color="blue" />
        <StatBox icon={FileText} label={isAr ? 'الكشوفات' : 'Exams'} value={myExams.length} color="violet" />
        <StatBox icon={Syringe} label={isAr ? 'اللقاحات' : 'Vaccines'} value={myVaccines.length} color="emerald" />
        <StatBox icon={Wallet} label={isAr ? 'المستحق' : 'Outstanding'} value={formatMoney(totalDue, 'SYP')} color="rose" />
      </div>

      {/* Alerts */}
      {(patient.allergiesDetailed?.length || 0) > 0 && (
        <Card className="border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/10">
          <CardHeader title={isAr ? '⚠ تنبيهات الحساسية' : '⚠ Allergy Alerts'} icon={<AlertCircle className="h-4 w-4 text-rose-500" />} />
          <CardBody>
            <div className="space-y-1.5">
              {patient.allergiesDetailed?.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-white p-2 text-xs dark:bg-rose-950/20">
                  <span className="font-semibold">{a.substance}</span>
                  <span className="text-rose-600">{a.reaction}</span>
                  <Badge variant={a.severity === 'severe' || a.severity === 'life-threatening' ? 'danger' : 'warning'}>
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Next appointments */}
        <Card>
          <CardHeader title={isAr ? 'المواعيد القادمة' : 'Upcoming Appointments'} icon={<Calendar className="h-4 w-4" />} />
          <CardBody>
            {myAppointments.length === 0 ? (
              <p className="text-xs text-[var(--text-3)]">{isAr ? 'لا توجد مواعيد' : 'No appointments'}</p>
            ) : (
              <div className="space-y-2">
                {myAppointments.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-[var(--border)] p-2 text-xs">
                    <div>
                      <div className="font-semibold">{a.reason}</div>
                      <div className="text-[10px] text-[var(--text-3)]">{formatDate(a.scheduledAt, true)}</div>
                    </div>
                    <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'info' : 'neutral'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent exams */}
        <Card>
          <CardHeader title={isAr ? 'آخر الكشوفات' : 'Recent Visits'} icon={<FileText className="h-4 w-4" />} />
          <CardBody>
            {myExams.length === 0 ? (
              <p className="text-xs text-[var(--text-3)]">{isAr ? 'لا توجد كشوفات' : 'No visits'}</p>
            ) : (
              <div className="space-y-2">
                {myExams.slice(0, 5).map((e) => (
                  <div key={e.id} className="rounded-md border border-[var(--border)] p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{e.diagnosis}</span>
                      <span className="text-[10px] text-[var(--text-3)]">{formatDate(e.examDate)}</span>
                    </div>
                    {e.prescriptions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.prescriptions.slice(0, 3).map((rx) => (
                          <span key={rx.id} className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/30">
                            💊 {rx.medicationName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Vaccines */}
        <Card>
          <CardHeader title={isAr ? 'اللقاحات' : 'Vaccines'} icon={<Syringe className="h-4 w-4" />} />
          <CardBody>
            {patient.immunizations && patient.immunizations.length > 0 ? (
              <div className="space-y-1.5">
                {patient.immunizations.map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-[var(--border)] p-2 text-xs">
                    <div>
                      <div className="font-semibold">{v.vaccine} - الجرعة {v.dose}</div>
                      <div className="text-[10px] text-[var(--text-3)]">{v.scheduledAge}</div>
                    </div>
                    <Badge variant={v.status === 'given' ? 'success' : v.status === 'pending' ? 'warning' : 'neutral'}>
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : myVaccines.length > 0 ? (
              <div className="space-y-1.5">
                {myVaccines.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-md border border-[var(--border)] p-2 text-xs">
                    <span className="font-semibold">💉 {v.vaccineName}</span>
                    <span className="text-[10px] text-[var(--text-3)]">{formatDate(v.administeredAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-3)]">{isAr ? 'لا توجد لقاحات' : 'No vaccines'}</p>
            )}
          </CardBody>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader title={isAr ? 'الفواتير والمستحقات' : 'Invoices & Balance'} icon={<Wallet className="h-4 w-4" />} />
          <CardBody>
            {myInvoices.length === 0 ? (
              <p className="text-xs text-[var(--text-3)]">{isAr ? 'لا توجد فواتير' : 'No invoices'}</p>
            ) : (
              <div className="space-y-1.5">
                {myInvoices.slice(0, 5).map((i) => {
                  const remaining = i.total - i.paid
                  return (
                    <div key={i.id} className="flex items-center justify-between rounded-md border border-[var(--border)] p-2 text-xs">
                      <div>
                        <div className="font-mono font-semibold">{i.number}</div>
                        <div className="text-[10px] text-[var(--text-3)]">{formatDate(i.createdAt)}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-bold tabular-nums">{formatMoney(i.total, i.currency)}</div>
                        {remaining > 0 && (
                          <div className="text-[10px] font-bold text-rose-600">
                            متبقي: {formatMoney(remaining, i.currency)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Medical info summary */}
      <Card>
        <CardHeader title={isAr ? 'المعلومات الطبية' : 'Medical Information'} icon={<Heart className="h-4 w-4" />} />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Field label={isAr ? 'فصيلة الدم' : 'Blood Type'} value={patient.bloodType || '-'} />
            <Field label={isAr ? 'الحساسية' : 'Allergies'} value={patient.allergies || (isAr ? 'لا يوجد' : 'None')} />
            <Field label={isAr ? 'الأمراض المزمنة' : 'Chronic'} value={patient.chronicConditions || (isAr ? 'لا يوجد' : 'None')} />
            <Field label={isAr ? 'آخر زيارة' : 'Last visit'} value={patient.lastVisitAt ? formatDate(patient.lastVisitAt) : '-'} />
            {patient.birthHistory?.birthWeightKg && (
              <Field label={isAr ? 'وزن الولادة' : 'Birth Weight'} value={`${patient.birthHistory.birthWeightKg} kg`} />
            )}
            {patient.birthHistory?.gestationalAgeWeeks && (
              <Field label={isAr ? 'عمر الحمل' : 'Gestational Age'} value={`${patient.birthHistory.gestationalAgeWeeks} ${isAr ? 'أسبوع' : 'w'}`} />
            )}
            {patient.birthHistory?.deliveryType && (
              <Field label={isAr ? 'نوع الولادة' : 'Delivery'} value={patient.birthHistory.deliveryType} />
            )}
            {patient.socialHistory?.schoolGrade && (
              <Field label={isAr ? 'المرحلة الدراسية' : 'School'} value={patient.socialHistory.schoolGrade} />
            )}
          </div>
          {patient.icd10Diagnoses && patient.icd10Diagnoses.length > 0 && (
            <div className="mt-3 rounded-md bg-violet-50 p-2 dark:bg-violet-950/20">
              <div className="text-[10px] font-semibold uppercase text-violet-700">ICD-10 {isAr ? 'التشخيصات' : 'Diagnoses'}</div>
              <div className="mt-1 space-y-1">
                {patient.icd10Diagnoses.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 font-mono font-bold text-violet-700">{d.code}</span>
                    <span>{d.description}</span>
                    <Badge variant={d.status === 'active' ? 'danger' : d.status === 'chronic' ? 'warning' : 'success'}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/10 to-cyan-500/10 text-blue-600',
    emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
    rose: 'from-rose-500/10 to-pink-500/10 text-rose-600',
    violet: 'from-violet-500/10 to-purple-500/10 text-violet-600',
  }
  return (
    <div className="surface p-3">
      <div className="flex items-center gap-2">
        <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase text-[var(--text-3)]">{label}</div>
          <div className="text-base font-bold tabular-nums">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase text-[var(--text-3)]">{label}</div>
      <div className="mt-0.5 text-xs font-semibold">{value}</div>
    </div>
  )
}
