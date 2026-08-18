import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Building2,
  Palette,
  UserCog,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Printer,
  Image as ImageIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  Hash,
  MessageCircle,
  Eye,
  Database,
  AlertTriangle,
  Smartphone,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuditStore } from '@/stores/auditStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useExamsStore } from '@/stores/examsStore'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { useVaccinesStore } from '@/stores/vaccinesStore'
import { useAccountingStore } from '@/stores/accountingStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/Motion'
import { CURRENCY_SYMBOLS, type Currency } from '@/types/invoice'
import type { Language, Theme } from '@/types'
import type { UserRole } from '@/types/user'
import { toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'
import { downloadSqlBackup } from '@/lib/sqlBackup'
import { useConfirm } from '@/components/notifications/Confirm'

type Section = 'clinic' | 'print' | 'appearance' | 'users' | 'data'

export function SettingsPage() {
  const { t, lang } = useTranslation()
  const confirm = useConfirm()
  const clinic = useSettingsStore((s) => s.clinic)
  const updateClinic = useSettingsStore((s) => s.updateClinic)
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const setCurrency = useSettingsStore((s) => s.setCurrency)
  const users = useAuthStore((s) => s.users)
  const addUser = useAuthStore((s) => s.addUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const deleteUser = useAuthStore((s) => s.deleteUser)
  const log = useAuditStore((s) => s.log)
  const currentUser = useAuthStore((s) => s.currentUser)

  const [section, setSection] = useState<Section>('clinic')
  const [local, setLocal] = useState(clinic)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const saveClinic = () => {
    updateClinic(local)
    log({
      userId: currentUser?.id ?? 'unknown',
      userName: currentUser?.fullName ?? 'unknown',
      action: 'update_clinic',
      entityType: 'clinic',
      entityId: 'clinic',
    })
    toast.success(
      lang === 'ar' ? 'تم حفظ التغييرات' : 'Settings saved',
      lang === 'ar' ? 'تم تحديث معلومات العيادة' : 'Clinic info updated'
    )
  }

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      toast.error(lang === 'ar' ? 'الصورة كبيرة جداً' : 'Image too large', lang === 'ar' ? 'الحد الأقصى 1 ميجا' : 'Max 1MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setLocal({ ...local, logo: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  const exportData = () => {
    const data = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      clinic,
      users: useAuthStore.getState().users,
      patients: usePatientsStore.getState().patients,
      appointments: useAppointmentsStore.getState().appointments,
      exams: useExamsStore.getState().exams,
      invoices: useInvoicesStore.getState().invoices,
      vaccines: useVaccinesStore.getState().vaccines,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `synapse-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(lang === 'ar' ? 'تم تصدير البيانات' : 'Data exported')
  }

  const resetData = async () => {
    const ok1 = await confirm({
      title: lang === 'ar' ? '⚠ تنبيه: حذف كل بيانات المرضى' : '⚠ Warning: Delete all patient data',
      description: lang === 'ar'
        ? 'سيتم حذف كل بيانات المرضى (ملفات، كشوفات، فواتير، لقاحات، مواعيد، قيود محاسبية) مع الإبقاء على حسابات الطاقم الطبي فقط. يُنصح بشدة بتحميل نسخة احتياطية قبل المتابعة.'
        : 'All patient data (files, exams, invoices, vaccines, appointments, journal entries) will be deleted, keeping only staff accounts. It is strongly recommended to download a backup before proceeding.',
      confirmText: lang === 'ar' ? 'متابعة' : 'Continue',
      cancelText: t.cancel,
      tone: 'warning',
    })
    if (!ok1) return

    const ok2 = await confirm({
      title: lang === 'ar' ? 'تأكيد نهائي' : 'Final confirmation',
      description: lang === 'ar'
        ? 'لا يمكن التراجع عن هذا الإجراء. هل تريد فعلاً المتابعة؟'
        : 'This action cannot be undone. Do you really want to continue?',
      confirmText: lang === 'ar' ? 'نعم، احذف' : 'Yes, delete',
      cancelText: t.cancel,
      tone: 'danger',
    })
    if (!ok2) return

    // 1) تفريغ كل مخازن البيانات السريرية والمالية
    usePatientsStore.setState({ patients: [] })
    useExamsStore.setState({ exams: [] })
    useInvoicesStore.setState({ invoices: [], counter: 1 })
    useVaccinesStore.setState({ vaccines: [] })
    useAppointmentsStore.setState({ appointments: [] })
    // تفريغ القيود المحاسبية مع الإبقاء على دليل الحسابات
    useAccountingStore.setState({ journalEntries: [], expenses: [] })
    // 2) حذف كل المستخدمين ما عدا الطاقم الطبي (admin/doctor/nurse/receptionist)
    useAuthStore.getState().clearAllPatientData()

    toast.info(
      lang === 'ar' ? 'تم مسح بيانات المرضى' : 'Patient data cleared',
      lang === 'ar' ? 'حسابات الطاقم الطبي محفوظة' : 'Staff accounts kept'
    )
    setTimeout(() => window.location.reload(), 800)
  }

  const sections: { v: Section; l: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { v: 'clinic', l: t.clinicInfo, icon: Building2 },
    { v: 'print', l: t.printSettings, icon: Printer },
    { v: 'appearance', l: t.appearance, icon: Palette },
    { v: 'users', l: t.users, icon: UserCog },
    { v: 'data', l: t.backup, icon: Download },
  ]

  return (
    <div className="space-y-5">
      <FadeIn>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.settings}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {lang === 'ar' ? 'إدارة عيادتك ومعلومات النظام' : 'Manage your clinic and system'}
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr]">
        {/* Tabs */}
        <div className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.v}
              onClick={() => setSection(s.v)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition-all',
                section === s.v
                  ? 'bg-[var(--primary)]/10 text-[var(--primary-2)]'
                  : 'text-[var(--text-2)] hover:bg-[var(--bg-2)] hover:text-[var(--text)]'
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.l}
            </button>
          ))}
        </div>

        {/* Content */}
        {section === 'clinic' && (
          <FadeIn>
            <Card padding="lg">
              <CardHeader
                title={t.clinicInfo}
                description={lang === 'ar' ? 'ستظهر هذه المعلومات في الفواتير والوصفات' : 'This info will appear on invoices and prescriptions'}
                icon={<Building2 className="h-4 w-4" />}
              />

              {/* Logo upload */}
              <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]/50 p-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--surface)]">
                  {local.logo ? (
                    <img src={local.logo} alt="logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-[var(--text-3)]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{t.clinicLogo}</div>
                  <div className="text-[11px] text-[var(--text-3)]">
                    {lang === 'ar' ? 'PNG، JPG، SVG - حد أقصى 1 ميجا' : 'PNG, JPG, SVG - Max 1MB'}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onLogoUpload}
                      className="hidden"
                    />
                    <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="me-1.5 h-3.5 w-3.5" />
                      {t.uploadImage}
                    </Button>
                    {local.logo && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLocal({ ...local, logo: '' })}
                      >
                        <Trash2 className="me-1.5 h-3.5 w-3.5" />
                        {t.delete}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label={lang === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}>
                  <Input value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
                </Field>
                <Field label={lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}>
                  <Input
                    value={local.nameEn}
                    onChange={(e) => setLocal({ ...local, nameEn: e.target.value })}
                  />
                </Field>
                <Field label={t.phoneLabel} icon={<Phone className="h-3 w-3" />}>
                  <Input value={local.phone} onChange={(e) => setLocal({ ...local, phone: e.target.value })} />
                </Field>
                <Field label={t.whatsapp} icon={<MessageCircle className="h-3 w-3" />}>
                  <Input
                    value={local.whatsapp}
                    onChange={(e) => setLocal({ ...local, whatsapp: e.target.value })}
                  />
                </Field>
                <Field label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} icon={<Mail className="h-3 w-3" />}>
                  <Input
                    value={local.email}
                    onChange={(e) => setLocal({ ...local, email: e.target.value })}
                  />
                </Field>
                <Field label={t.licenseNumber} icon={<Hash className="h-3 w-3" />}>
                  <Input
                    value={local.licenseNumber}
                    onChange={(e) => setLocal({ ...local, licenseNumber: e.target.value })}
                  />
                </Field>
                <Field label={lang === 'ar' ? 'العنوان بالعربية' : 'Address (Arabic)'} icon={<MapPin className="h-3 w-3" />} className="md:col-span-2">
                  <Textarea
                    value={local.address}
                    onChange={(e) => setLocal({ ...local, address: e.target.value })}
                    rows={2}
                  />
                </Field>
                <Field label={lang === 'ar' ? 'العنوان بالإنجليزية' : 'Address (English)'} className="md:col-span-2">
                  <Textarea
                    value={local.addressEn}
                    onChange={(e) => setLocal({ ...local, addressEn: e.target.value })}
                    rows={2}
                  />
                </Field>
                <Field label={t.mapLink} className="md:col-span-2">
                  <Input
                    value={local.mapLink}
                    onChange={(e) => setLocal({ ...local, mapLink: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </Field>
                <Field label={t.workingHours} icon={<Clock className="h-3 w-3" />} className="md:col-span-2">
                  <Input
                    value={local.workingHours}
                    onChange={(e) => setLocal({ ...local, workingHours: e.target.value })}
                  />
                </Field>

                <Field
                  label={lang === 'ar' ? 'رابط تحميل تطبيق المريض' : 'Patient app download URL'}
                  icon={<Smartphone className="h-3 w-3" />}
                  className="md:col-span-2"
                >
                  <Input
                    value={local.patientAppDownloadUrl ?? ''}
                    onChange={(e) => setLocal({ ...local, patientAppDownloadUrl: e.target.value })}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    dir="ltr"
                  />
                </Field>
                <Field
                  label={lang === 'ar' ? 'اسم التطبيق' : 'App name'}
                  className="md:col-span-2"
                >
                  <Input
                    value={local.patientAppName ?? ''}
                    onChange={(e) => setLocal({ ...local, patientAppName: e.target.value })}
                    placeholder={lang === 'ar' ? 'سينابس - تطبيق المرضى' : 'Synapse Patient App'}
                  />
                </Field>
                <Field label={t.taxRate + ' (%)'}>
                  <Input
                    type="number"
                    value={local.taxRate}
                    onChange={(e) => setLocal({ ...local, taxRate: Number(e.target.value) || 0 })}
                  />
                </Field>
                <Field label={t.currency}>
                  <Select
                    value={local.currency}
                    onChange={(e) => {
                      setLocal({ ...local, currency: e.target.value as Currency })
                      setCurrency(e.target.value as Currency)
                    }}
                  >
                    {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map((c) => (
                      <option key={c} value={c}>
                        {c} ({CURRENCY_SYMBOLS[c]})
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setLocal(clinic)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="primary" onClick={saveClinic} leftIcon={<Save className="h-4 w-4" />}>
                  {t.save}
                </Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {section === 'print' && (
          <FadeIn>
            <Card padding="lg">
              <CardHeader
                title={t.printSettings}
                description={lang === 'ar' ? 'تحكم في شكل المطبوعات' : 'Customize your print output'}
                icon={<Printer className="h-4 w-4" />}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setShowPrintPreview(true)} leftIcon={<Eye className="h-3.5 w-3.5" />}>
                    {t.printPreview}
                  </Button>
                }
              />
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label={t.paperSize}>
                  <Select
                    value={local.print.paperSize}
                    onChange={(e) =>
                      setLocal({
                        ...local,
                        print: { ...local.print, paperSize: e.target.value as 'A4' | 'A5' },
                      })
                    }
                  >
                    <option value="A4">{t.paperA4}</option>
                    <option value="A5">{t.paperA5}</option>
                  </Select>
                </Field>
                <Field label={t.margins}>
                  <Select
                    value={local.print.margins}
                    onChange={(e) =>
                      setLocal({
                        ...local,
                        print: {
                          ...local.print,
                          margins: e.target.value as 'narrow' | 'normal' | 'wide',
                        },
                      })
                    }
                  >
                    <option value="narrow">{t.marginsNarrow}</option>
                    <option value="normal">{t.marginsNormal}</option>
                    <option value="wide">{t.marginsWide}</option>
                  </Select>
                </Field>
                <Field label={t.fontSize}>
                  <Select
                    value={local.print.fontSize}
                    onChange={(e) =>
                      setLocal({
                        ...local,
                        print: { ...local.print, fontSize: e.target.value as 'sm' | 'md' | 'lg' },
                      })
                    }
                  >
                    <option value="sm">{t.fontSizeSm}</option>
                    <option value="md">{t.fontSizeMd}</option>
                    <option value="lg">{t.fontSizeLg}</option>
                  </Select>
                </Field>
                <Field label={t.primaryColor}>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={local.print.primaryColor}
                      onChange={(e) =>
                        setLocal({
                          ...local,
                          print: { ...local.print, primaryColor: e.target.value },
                        })
                      }
                      className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
                    />
                    <Input
                      value={local.print.primaryColor}
                      onChange={(e) =>
                        setLocal({
                          ...local,
                          print: { ...local.print, primaryColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-5 space-y-3">
                <Toggle
                  label={t.showLogo}
                  description={lang === 'ar' ? 'إظهار شعار العيادة في الترويسة' : 'Show clinic logo in header'}
                  checked={local.print.showLogo}
                  onChange={(v) => setLocal({ ...local, print: { ...local.print, showLogo: v } })}
                />
                <Toggle
                  label={t.showSignature}
                  description={lang === 'ar' ? 'إظهار مكان التوقيع في المطبوعات' : 'Show signature line in prints'}
                  checked={local.print.showSignature}
                  onChange={(v) => setLocal({ ...local, print: { ...local.print, showSignature: v } })}
                />
                <Toggle
                  label={t.showSynapseFooter}
                  description={lang === 'ar' ? 'إضافة توقيع سينابس سيستمز في التذييل' : 'Add Synapse Systems footer'}
                  checked={local.print.showSynapseFooter}
                  onChange={(v) =>
                    setLocal({ ...local, print: { ...local.print, showSynapseFooter: v } })
                  }
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setLocal(clinic)}>
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="primary" onClick={saveClinic} leftIcon={<Save className="h-4 w-4" />}>
                  {t.save}
                </Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {section === 'appearance' && (
          <FadeIn>
            <Card padding="lg">
              <CardHeader title={t.appearance} icon={<Palette className="h-4 w-4" />} />

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {t.theme}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: 'light' as Theme, l: t.themeLight },
                        { v: 'dark' as Theme, l: t.themeDark },
                        { v: 'system' as Theme, l: t.themeSystem },
                      ]
                    ).map((th) => (
                      <button
                        key={th.v}
                        onClick={() => setTheme(th.v)}
                        className={cn(
                          'rounded-xl border p-3 text-center text-sm font-medium transition-all',
                          theme === th.v
                            ? 'border-[var(--primary-2)] bg-[var(--primary)]/10 text-[var(--primary-2)]'
                            : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        {th.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                    {t.language}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { v: 'ar' as Language, l: t.arabic, icon: '🇸🇦' },
                        { v: 'en' as Language, l: t.english, icon: '🇬🇧' },
                      ]
                    ).map((l) => (
                      <button
                        key={l.v}
                        onClick={() => setLanguage(l.v)}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all',
                          language === l.v
                            ? 'border-[var(--primary-2)] bg-[var(--primary)]/10 text-[var(--primary-2)]'
                            : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-strong)]'
                        )}
                      >
                        <span className="text-base">{l.icon}</span>
                        {l.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {section === 'users' && (
          <FadeIn>
            <Card padding="lg">
              <CardHeader
                title={t.users}
                description={`${users.length} ${lang === 'ar' ? 'مستخدم' : 'users'}`}
                icon={<UserCog className="h-4 w-4" />}
              />
              <Stagger className="mt-4 space-y-2">
                {users.map((u) => (
                  <StaggerItem key={u.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <Avatar name={u.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{u.fullName}</div>
                        <div className="text-[11px] text-[var(--text-3)]">
                          @{u.username} • {u.specialty || (String(t[u.role as keyof typeof t] ?? u.role))}
                        </div>
                      </div>
                      <Badge
                        tone={
                          u.role === 'admin'
                            ? 'accent'
                            : u.role === 'doctor'
                            ? 'primary'
                            : u.role === 'nurse'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {String(t[u.role as keyof typeof t] ?? u.role)}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-rose-500"
                        onClick={async () => {
                          if (u.id === currentUser?.id) return
                          const ok = await confirm({
                            title: lang === 'ar' ? `حذف ${u.fullName}؟` : `Delete ${u.fullName}?`,
                            description: lang === 'ar'
                              ? 'سيتم حذف حساب المستخدم نهائياً. لا يمكن التراجع.'
                              : 'This will permanently delete the user account. This action cannot be undone.',
                            confirmText: lang === 'ar' ? 'حذف' : 'Delete',
                            cancelText: t.cancel,
                            tone: 'danger',
                          })
                          if (ok) {
                            deleteUser(u.id)
                            toast.success(lang === 'ar' ? 'تم حذف المستخدم' : 'User deleted')
                          }
                        }}
                        title={t.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </Card>
          </FadeIn>
        )}

        {section === 'data' && (
          <FadeIn>
            <Card padding="lg">
              <CardHeader title={t.backup} icon={<Download className="h-4 w-4" />} />
              <div className="mt-4 space-y-3">
                {/* ===== تصدير SQL ===== */}
                <button
                  onClick={() => {
                    try {
                      const summary = downloadSqlBackup()
                      toast.success(
                        lang === 'ar' ? 'تم تصدير SQL' : 'SQL exported',
                        lang === 'ar'
                          ? `${summary.patients} مريض • ${summary.exams} كشف • ${summary.invoices} فاتورة (${(summary.totalBytes / 1024).toFixed(1)} KB)`
                          : `${summary.patients} patients • ${summary.exams} exams • ${summary.invoices} invoices`
                      )
                    } catch (e) {
                      toast.error(lang === 'ar' ? 'فشل التصدير' : 'Export failed')
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-3 text-start transition-all hover:border-emerald-500/60"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      {lang === 'ar' ? 'تصدير قاعدة البيانات SQL' : 'Export database as SQL'}
                    </div>
                    <div className="text-[11px] text-[var(--text-3)]">
                      {lang === 'ar'
                        ? 'ملف .sql متوافق مع MySQL/Postgres للترحيل أو الاسترجاع'
                        : 'MySQL/Postgres compatible .sql file for migration or restore'}
                    </div>
                  </div>
                </button>

                {/* ===== تصدير JSON ===== */}
                <button
                  onClick={exportData}
                  className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-start transition-all hover:border-[var(--primary-2)]/40"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t.exportData}</div>
                    <div className="text-[11px] text-[var(--text-3)]">
                      {lang === 'ar' ? 'JSON شامل لكل بياناتك' : 'Complete JSON of your data'}
                    </div>
                  </div>
                </button>

                {/* ===== إعادة تعيين (تحذير) ===== */}
                <div className="rounded-xl border-2 border-rose-500/40 bg-rose-500/5 p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <div className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                        {lang === 'ar' ? 'منطقة الخطر' : 'Danger zone'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--text-3)]">
                        {lang === 'ar'
                          ? 'سيتم حذف كل بيانات المرضى (الملفات، الكشوفات، الفواتير، اللقاحات، المواعيد، القيود المحاسبية) مع الإبقاء على حسابات الطاقم الطبي فقط (admin, doctor, nurse, receptionist).'
                          : 'All patient data (files, exams, invoices, vaccines, appointments, journal entries) will be deleted, keeping only staff accounts (admin, doctor, nurse, receptionist).'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => downloadSqlBackup()}
                      leftIcon={<Database className="h-3.5 w-3.5" />}
                    >
                      {lang === 'ar' ? 'احفظ نسخة احتياطية أولاً' : 'Backup first'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={resetData}
                      leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                    >
                      {lang === 'ar' ? 'حذف كل بيانات المرضى' : 'Delete all patient data'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>

      <AnimatePresence>
        {showPrintPreview && (
          <PrintPreviewModal
            clinic={local}
            onClose={() => setShowPrintPreview(false)}
            onSave={() => {
              saveClinic()
              setShowPrintPreview(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({
  label,
  children,
  className = '',
  icon,
}: {
  label: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-2)]">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-start transition-all hover:border-[var(--border-strong)]"
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {description && <div className="mt-0.5 text-[11px] text-[var(--text-3)]">{description}</div>}
      </div>
      <div
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--border-strong)]'
        )}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  )
}

function PrintPreviewModal({
  clinic,
  onClose,
  onSave,
}: {
  clinic: any
  onClose: () => void
  onSave: () => void
}) {
  const { lang } = useTranslation()
  const isAr = lang === 'ar'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] p-4">
          <div>
            <h3 className="text-lg font-bold">
              {isAr ? 'معاينة الطباعة' : 'Print preview'}
            </h3>
            <p className="text-xs text-[var(--text-3)]">
              {isAr ? 'هكذا ستظهر مطبوعاتك' : 'This is how your prints will look'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
            <Button variant="primary" onClick={onSave} leftIcon={<Save className="h-3.5 w-3.5" />}>
              {isAr ? 'حفظ الإعدادات' : 'Save settings'}
            </Button>
          </div>
        </div>
        <div className="bg-[var(--bg-2)] p-6">
          <div
            className="mx-auto bg-white text-slate-900 shadow-2xl"
            style={{
              maxWidth: clinic.print.paperSize === 'A5' ? '420px' : '720px',
              padding:
                clinic.print.margins === 'narrow'
                  ? '1.5rem'
                  : clinic.print.margins === 'wide'
                  ? '3rem'
                  : '2rem',
              fontSize: clinic.print.fontSize === 'sm' ? '0.8rem' : clinic.print.fontSize === 'lg' ? '1.05rem' : '0.9rem',
            }}
          >
            {/* Print header */}
            <div
              className="mb-4 flex items-start gap-3 border-b-2 pb-3"
              style={{ borderColor: clinic.print.primaryColor }}
            >
              {clinic.print.showLogo && clinic.logo && (
                <img src={clinic.logo} alt="logo" className="h-14 w-14 object-contain" />
              )}
              {!clinic.logo && (
                <div
                  className="grid h-14 w-14 place-items-center rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg, ${clinic.print.primaryColor}, #8b5cf6)` }}
                >
                  <Building2 className="h-7 w-7" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-bold">
                  {isAr ? clinic.name : clinic.nameEn}
                </h2>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'نقطة الاتصال الذكية للرعاية' : 'Where Intelligence Connects Care'}
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  {isAr ? clinic.address : clinic.addressEn}
                </p>
                <p className="text-[10px] text-slate-600">
                  {clinic.phone} • {clinic.email}
                </p>
              </div>
            </div>

            {/* Sample content */}
            <div className="mb-3">
              <h3
                className="mb-2 text-sm font-bold"
                style={{ color: clinic.print.primaryColor }}
              >
                {isAr ? 'فاتورة تجريبية' : 'Sample invoice'}
              </h3>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-[10px]">
                <div className="flex justify-between">
                  <span>{isAr ? 'المريض' : 'Patient'}</span>
                  <span className="font-semibold">أحمد محمد</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'التاريخ' : 'Date'}</span>
                  <span>2026-08-15</span>
                </div>
              </div>
            </div>

            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-1 text-start">{isAr ? 'الوصف' : 'Description'}</th>
                  <th className="py-1 text-end">{isAr ? 'الكمية' : 'Qty'}</th>
                  <th className="py-1 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-1">{isAr ? 'كشف عام' : 'General exam'}</td>
                  <td className="py-1 text-end">1</td>
                  <td className="py-1 text-end">50,000 ل.س</td>
                </tr>
              </tbody>
            </table>

            {clinic.print.showSignature && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500">{isAr ? 'توقيع الطبيب' : 'Doctor signature'}</div>
                  <div className="mt-2 h-10 border-b-2 border-dashed border-slate-300" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">{isAr ? 'الختم' : 'Stamp'}</div>
                  <div className="mt-2 h-10 border-2 border-dashed border-slate-300" />
                </div>
              </div>
            )}

            {clinic.print.showSynapseFooter && (
              <div className="mt-4 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
                Powered by Synapse Systems • سينابس سيستمز
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
