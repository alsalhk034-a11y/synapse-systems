import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Printer,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuditStore } from '@/stores/auditStore'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { PatientBadge } from '@/components/ui/Avatar'
import { FadeIn } from '@/components/ui/Motion'
import { formatCurrency, formatAge } from '@/lib/format'
import { CURRENCY_SYMBOLS, type Currency, type InvoiceItem } from '@/types/invoice'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function InvoiceNewPage() {
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialPatient = params.get('patientId') ?? ''
  const addInvoice = useInvoicesStore((s) => s.addInvoice)
  const patients = usePatientsStore((s) => s.patients)
  const clinic = useSettingsStore((s) => s.clinic)
  const user = useAuthStore((s) => s.currentUser)
  const createPatientAccount = useAuthStore((s) => s.createPatientAccount)
  const getPatientAccount = useAuthStore((s) => s.getPatientAccount)
  const log = useAuditStore((s) => s.log)

  const [patientId, setPatientId] = useState(initialPatient)
  const [currency, setCurrency] = useState<Currency>(clinic.currency)
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(clinic.taxRate)
  const [paid, setPaid] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: generateId('it'), description: lang === 'ar' ? 'كشف' : 'Consultation', quantity: 1, unitPrice: 100000, total: 100000 },
  ])

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items])
  const afterDiscount = Math.max(0, subtotal - discount)
  const tax = (afterDiscount * taxRate) / 100
  const total = afterDiscount + tax
  const remaining = Math.max(0, total - paid)

  const addItem = () =>
    setItems((its) => [
      ...its,
      { id: generateId('it'), description: '', quantity: 1, unitPrice: 0, total: 0 },
    ])

  const updateItem = (id: string, data: Partial<InvoiceItem>) => {
    setItems((its) =>
      its.map((it) => {
        if (it.id !== id) return it
        const merged = { ...it, ...data }
        merged.total = (merged.quantity || 0) * (merged.unitPrice || 0)
        return merged
      })
    )
  }

  const removeItem = (id: string) => setItems((its) => its.filter((i) => i.id !== id))

  const onSave = (thenPrint = false) => {
    if (!patientId) {
      alert(lang === 'ar' ? 'اختر المريض' : 'Select patient')
      return
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      alert(lang === 'ar' ? 'أضف بنداً واحداً على الأقل' : 'Add at least one item')
      return
    }
    const status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'

    // إنشاء حساب للمريض تلقائياً عند أول فاتورة (إن لم يكن له حساب)
    const selectedPatient = patients.find((p) => p.id === patientId)
    if (selectedPatient) {
      const existing = getPatientAccount(selectedPatient.id)
      if (!existing) {
        const result = createPatientAccount(
          selectedPatient.id,
          selectedPatient.fullName,
          selectedPatient.birthDate
        )
        if (!result.alreadyExisted) {
          const alertMsg =
            lang === 'ar'
              ? `تم إنشاء حساب المريض تلقائياً:\nاسم المستخدم: ${result.user.username}\nكلمة المرور: ${result.generatedPassword}\n(ستظهر في الفاتورة المطبوعة)`
              : `Patient account auto-created:\nUsername: ${result.user.username}\nPassword: ${result.generatedPassword}\n(Will appear on printed invoice)`
          alert(alertMsg)
        }
      }
    }

    const inv = addInvoice({
      patientId,
      createdBy: user?.id ?? 'unknown',
      currency,
      items: items.filter((i) => i.description.trim()),
      discount,
      taxRate,
      paid,
      status,
      notes,
    } as any)
    log({
      userId: user?.id ?? 'unknown',
      userName: user?.fullName ?? 'unknown',
      action: 'create_invoice',
      entityType: 'invoice',
      entityId: inv.id,
      details: { total: inv.total, patientId },
    })
    if (thenPrint) {
      navigate('/invoices/' + inv.id + '?print=1')
    } else {
      navigate('/invoices/' + inv.id)
    }
  }

  const patient = patients.find((p) => p.id === patientId)

  return (
    <div className="space-y-5">
      <FadeIn>
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t.back}
        </button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{t.newInvoiceTitle}</h1>
      </FadeIn>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <FadeIn>
            <Card padding="md">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                    {t.patient}
                  </label>
                  <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
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
                    {t.currency}
                  </label>
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                  >
                    {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map((c) => (
                      <option key={c} value={c}>
                        {c} ({CURRENCY_SYMBOLS[c]})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {patient && (
                <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-3">
                  <PatientBadge
                    name={patient.fullName}
                    age={formatAge(patient.birthDate, lang)}
                    gender={patient.gender}
                    size="sm"
                  />
                </div>
              )}
            </Card>
          </FadeIn>

          <FadeIn delay={0.05}>
            <Card padding="md">
              <CardHeader
                title={t.items}
                description={`${items.length} ${lang === 'ar' ? 'بند' : 'items'}`}
                action={
                  <Button variant="subtle" size="sm" onClick={addItem} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                    {t.addItem}
                  </Button>
                }
              />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-start text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                      <th className="py-2 ps-2 font-medium">{t.description}</th>
                      <th className="w-20 py-2 font-medium">{t.quantity}</th>
                      <th className="w-32 py-2 font-medium">{t.unitPrice}</th>
                      <th className="w-32 py-2 text-end font-medium">{t.total}</th>
                      <th className="w-10 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="py-1.5 pe-2">
                          <Input
                            value={it.description}
                            onChange={(e) => updateItem(it.id, { description: e.target.value })}
                            placeholder={lang === 'ar' ? 'بند...' : 'Item...'}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1.5 pe-2">
                          <Input
                            type="number"
                            value={it.quantity}
                            onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1.5 pe-2">
                          <Input
                            type="number"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-1.5 text-end font-semibold tabular-nums">
                          {formatCurrency(it.total, currency, lang)}
                        </td>
                        <td className="py-1.5 text-end">
                          <button
                            onClick={() => removeItem(it.id)}
                            className="rounded p-1 text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card padding="md">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                    {t.discount}
                  </label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                    {t.taxRate} (%)
                  </label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                    {t.paid}
                  </label>
                  <Input
                    type="number"
                    value={paid}
                    onChange={(e) => setPaid(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-2)]">
                    {t.notes}
                  </label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>

        <div className="space-y-5">
          <FadeIn delay={0.05}>
            <Card padding="lg" className="sticky top-20">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
                {lang === 'ar' ? 'الملخص' : 'Summary'}
              </h3>
              <div className="space-y-2 text-sm">
                <Row label={t.subtotal} value={formatCurrency(subtotal, currency, lang)} />
                <Row label={t.discount} value={`-${formatCurrency(discount, currency, lang)}`} />
                <Row label={t.tax} value={formatCurrency(tax, currency, lang)} />
                <div className="my-2 border-t border-[var(--border)]" />
                <Row label={t.total} value={formatCurrency(total, currency, lang)} big />
                <Row label={t.paid} value={formatCurrency(paid, currency, lang)} />
                {remaining > 0 && (
                  <Row
                    label={t.remaining}
                    value={formatCurrency(remaining, currency, lang)}
                    tone="amber"
                  />
                )}
              </div>

              <div className="mt-5 space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={() => onSave(false)}
                >
                  {t.save}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  leftIcon={<Printer className="h-4 w-4" />}
                  onClick={() => onSave(true)}
                >
                  {t.save} & {t.print}
                </Button>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  big,
  tone,
}: {
  label: string
  value: string
  big?: boolean
  tone?: 'amber'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-2)]">{label}</span>
      <span
        className={cn(
          'tabular-nums',
          big && 'text-lg font-bold',
          tone === 'amber' && 'text-amber-600 dark:text-amber-400'
        )}
      >
        {value}
      </span>
    </div>
  )
}
