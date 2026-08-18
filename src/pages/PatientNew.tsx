import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ChevronLeft, User, Phone, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAuditStore } from '@/stores/auditStore'
import { useAuthStore } from '@/stores/authStore'
import { Card } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FadeIn } from '@/components/ui/Motion'
import { toast } from '@/stores/toastStore'

export function PatientNewPage() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const addPatient = usePatientsStore((s) => s.addPatient)
  const log = useAuditStore((s) => s.log)
  const user = useAuthStore((s) => s.currentUser)
  const createPatientAccount = useAuthStore((s) => s.createPatientAccount)

  const [form, setForm] = useState({
    fullName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    parentName: '',
    parentPhone: '',
    address: '',
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    notes: '',
  })
  const [autoCreateAccount, setAutoCreateAccount] = useState(true)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const update = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }))

  // Validation فورية — تُحسب فقط بعد لمس الحقل أو عند الإرسال
  const errors = useMemo(() => {
    const e: Partial<Record<keyof typeof form, string>> = {}
    const isAr = lang === 'ar'
    if (!form.fullName.trim()) e.fullName = isAr ? 'الاسم الكامل مطلوب' : 'Full name is required'
    else if (form.fullName.trim().length < 3) e.fullName = isAr ? 'الاسم قصير جداً' : 'Name is too short'
    if (!form.birthDate) e.birthDate = isAr ? 'تاريخ الميلاد مطلوب' : 'Birth date is required'
    else {
      const bd = new Date(form.birthDate)
      const now = new Date()
      if (isNaN(bd.getTime())) e.birthDate = isAr ? 'تاريخ غير صالح' : 'Invalid date'
      else if (bd > now) e.birthDate = isAr ? 'لا يمكن أن يكون بالمستقبل' : 'Cannot be in the future'
      else if (now.getFullYear() - bd.getFullYear() > 25)
        e.birthDate = isAr ? 'عمر غير منطقي للعيادة' : 'Age is unrealistic for this clinic'
    }
    if (form.phone && form.phone.trim()) {
      // يقبل أرقام فقط، يمكن أن يبدأ بـ +
      if (!/^\+?[\d\s\-\(\)]{6,20}$/.test(form.phone.trim()))
        e.phone = isAr ? 'رقم هاتف غير صالح' : 'Invalid phone number'
    }
    if (form.parentPhone && form.parentPhone.trim()) {
      if (!/^\+?[\d\s\-\(\)]{6,20}$/.test(form.parentPhone.trim()))
        e.parentPhone = isAr ? 'رقم هاتف غير صالح' : 'Invalid phone number'
    }
    return e
  }, [form, lang])

  const showError = (k: keyof typeof form) => touched[k] && errors[k]
  const markTouched = (k: keyof typeof form) => setTouched((t) => ({ ...t, [k]: true }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // ضع touched=true على كل الحقول لتفعيل إظهار الأخطاء
    setTouched({
      fullName: true,
      birthDate: true,
      gender: true,
      phone: true,
      parentName: true,
      parentPhone: true,
    })
    if (Object.keys(errors).length > 0) {
      toast.error(lang === 'ar' ? 'يرجى تصحيح الأخطاء قبل المتابعة' : 'Please fix the errors before continuing')
      return
    }
    const p = addPatient(form)
    log({
      userId: user?.id ?? 'unknown',
      userName: user?.fullName ?? 'unknown',
      action: 'create_patient',
      entityType: 'patient',
      entityId: p.id,
      details: { fullName: p.fullName },
    })

    // إنشاء حساب بوابة المريض تلقائياً
    let accountInfo: { username: string; password: string } | null = null
    if (autoCreateAccount) {
      const result = createPatientAccount(p.id, p.fullName, p.birthDate)
      accountInfo = { username: result.user.username, password: result.generatedPassword }
      log({
        userId: user?.id ?? 'unknown',
        userName: user?.fullName ?? 'unknown',
        action: 'create_patient_account',
        entityType: 'user',
        entityId: result.user.id,
        details: { username: result.user.username, patientId: p.id, autoCreated: true },
      })
      toast.success(
        lang === 'ar' ? `تم إنشاء حساب ${p.fullName} تلقائياً` : `Account for ${p.fullName} created automatically`,
        lang === 'ar' ? `اسم المستخدم: ${result.user.username}` : `Username: ${result.user.username}`
      )
    }

    // الانتقال لصفحة المريض مع تمرير بيانات الحساب لعرضها
    if (accountInfo) {
      navigate(`/patients/${p.id}?newAccount=1&u=${encodeURIComponent(accountInfo.username)}&p=${encodeURIComponent(accountInfo.password)}`)
    } else {
      navigate('/patients/' + p.id)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FadeIn>
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)] rtl:flex-row-reverse"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t.back}
        </button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{t.addPatient}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {lang === 'ar' ? 'أدخل بيانات المريض الجديد' : 'Enter the new patient details'}
        </p>
      </FadeIn>

      <form onSubmit={submit} className="space-y-5">
        <FadeIn delay={0.05}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                <User className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold">
                {lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label={t.fullName} required error={showError('fullName')}>
                <Input
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  onBlur={() => markTouched('fullName')}
                  required
                  placeholder={lang === 'ar' ? 'الاسم الكامل' : 'Full name'}
                  invalid={!!showError('fullName')}
                />
              </Field>
              <Field label={t.birthDate} required error={showError('birthDate')}>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => update('birthDate', e.target.value)}
                  onBlur={() => markTouched('birthDate')}
                  required
                  invalid={!!showError('birthDate')}
                />
              </Field>
              <Field label={t.gender}>
                <Select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                >
                  <option value="male">{t.male}</option>
                  <option value="female">{t.female}</option>
                </Select>
              </Field>
              <Field label={t.bloodType}>
                <Select value={form.bloodType} onChange={(e) => update('bloodType', e.target.value)}>
                  <option value="">—</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-500">
                <Phone className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold">
                {lang === 'ar' ? 'بيانات الاتصال وولي الأمر' : 'Contact & Parent'}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label={t.parentName}>
                <Input
                  value={form.parentName}
                  onChange={(e) => update('parentName', e.target.value)}
                  placeholder={lang === 'ar' ? 'اسم الأب أو الأم' : 'Parent name'}
                />
              </Field>
              <Field label={t.parentPhone} error={showError('parentPhone')}>
                <Input
                  value={form.parentPhone}
                  onChange={(e) => update('parentPhone', e.target.value)}
                  onBlur={() => markTouched('parentPhone')}
                  placeholder="+963 ..."
                  invalid={!!showError('parentPhone')}
                />
              </Field>
              <Field label={t.phone} className="md:col-span-2" error={showError('phone')}>
                <Input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  onBlur={() => markTouched('phone')}
                  placeholder="+963 ..."
                  invalid={!!showError('phone')}
                />
              </Field>
              <Field label={t.address} className="md:col-span-2">
                <Input
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder={lang === 'ar' ? 'المدينة - الحي' : 'City - District'}
                />
              </Field>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card padding="lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold">
                {lang === 'ar' ? 'معلومات طبية' : 'Medical Information'}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Field label={t.allergies}>
                <Input
                  value={form.allergies}
                  onChange={(e) => update('allergies', e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: البنسلين، المكسرات' : 'e.g. Penicillin, nuts'}
                />
              </Field>
              <Field label={t.chronicConditions}>
                <Input
                  value={form.chronicConditions}
                  onChange={(e) => update('chronicConditions', e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: ربو، سكري' : 'e.g. Asthma, diabetes'}
                />
              </Field>
              <Field label={t.notes}>
                <Textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  rows={3}
                />
              </Field>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card padding="md" className="border-blue-500/30 bg-blue-500/5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCreateAccount}
                onChange={(e) => setAutoCreateAccount(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-[var(--text)]">
                  {lang === 'ar' ? 'إنشاء حساب بوابة المريض تلقائياً' : 'Auto-create patient portal account'}
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--text-2)] leading-relaxed">
                  {lang === 'ar'
                    ? 'سيتم توليد اسم مستخدم (الاسم + سنة الميلاد) وكلمة سر عشوائية. ستظهر البيانات على صفحة المريض ويمكنك طباعتها مع الفاتورة.'
                    : 'A username (name + birth year) and a random password will be generated. The credentials will appear on the patient page and can be printed with the invoice.'}
                </p>
              </div>
            </label>
          </Card>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => navigate('/patients')}>
              {t.cancel}
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save className="h-4 w-4" />}>
              {t.save}
            </Button>
          </div>
        </FadeIn>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
  required,
  error,
  className = '',
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string | false
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[var(--text-2)]">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-500 animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
