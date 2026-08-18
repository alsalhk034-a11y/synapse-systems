import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Printer,
  ChevronLeft,
  Receipt,
  CheckCircle2,
  Wallet,
  Hexagon,
  Phone,
  MapPin,
  Mail,
  Eye,
} from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useInvoicesStore } from '@/stores/invoicesStore'
import { usePatientsStore } from '@/stores/patientsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FadeIn } from '@/components/ui/Motion'
import { PrintPreviewModal } from '@/components/print/PrintPreviewModal'
import { InvoicePrintable } from '@/components/print/PrintInvoicePrintable'
import { formatCurrency, formatDate } from '@/lib/format'
import { toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, lang } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const getInvoice = useInvoicesStore((s) => s.invoices.find((i) => i.id === id))
  const updateStatus = useInvoicesStore((s) => s.updateStatus)
  const patient = usePatientsStore((s) => s.patients.find((p) => p.id === getInvoice?.patientId))
  const clinic = useSettingsStore((s) => s.clinic)
  const user = useAuthStore((s) => s.currentUser)
  const getPatientAccount = useAuthStore((s) => s.getPatientAccount)
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // بيانات دخول المريض للطباعة — تُجلب من حسابه إن وُجد
  const patientAccount = patient ? getPatientAccount(patient.id) : undefined
  const patientCredentials = patientAccount
    ? { username: patientAccount.username, password: patientAccount.password }
    : null

  useEffect(() => {
    if (params.get('print') === '1') {
      setShowPrintPreview(true)
    }
  }, [params])

  if (!getInvoice) {
    return (
      <div className="grid h-[60vh] place-items-center text-sm text-[var(--text-3)]">
        {lang === 'ar' ? 'الفاتورة غير موجودة' : 'Invoice not found'}
      </div>
    )
  }

  const inv = getInvoice
  const remaining = inv.total - inv.paid

  return (
    <div className="space-y-5">
      {/* Toolbar (no-print) */}
      <FadeIn>
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-1 text-sm text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            {t.back}
          </button>
          <div className="flex items-center gap-2">
            {inv.status === 'pending' && (
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => {
                  updateStatus(inv.id, 'paid', inv.total)
                  toast.success(
                    lang === 'ar' ? 'تم تأكيد الدفع' : 'Payment confirmed',
                    `${formatCurrency(inv.total, inv.currency, lang)}`
                  )
                }}
              >
                {lang === 'ar' ? 'تأكيد الدفع' : 'Mark as paid'}
              </Button>
            )}
            {inv.status === 'partial' && (
              <Button
                variant="primary"
                leftIcon={<Wallet className="h-4 w-4" />}
                onClick={() => {
                  updateStatus(inv.id, 'paid', inv.total)
                  toast.success(
                    lang === 'ar' ? 'تم إكمال الدفع' : 'Payment completed'
                  )
                }}
              >
                {lang === 'ar' ? 'إكمال الدفع' : 'Complete payment'}
              </Button>
            )}
            <Button
              variant="ghost"
              leftIcon={<Eye className="h-4 w-4" />}
              onClick={() => setShowPrintPreview(true)}
            >
              {t.printPreview || (lang === 'ar' ? 'معاينة' : 'Preview')}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => setShowPrintPreview(true)}
            >
              {t.printInvoice}
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Invoice document */}
      <FadeIn>
        <div className="mx-auto max-w-3xl">
          <Card padding="lg" className="relative overflow-hidden">
            {/* Decorative top bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-teal-500" />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Clinic info */}
              <div>
                <div className="flex items-center gap-3">
                  {clinic.logo ? (
                    <img src={clinic.logo} alt="logo" className="h-10 w-10 rounded-xl object-contain" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-violet-500 shadow-glow">
                      <Hexagon className="h-5 w-5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold">{lang === 'ar' ? clinic.name : clinic.nameEn}</h2>
                    <p className="text-[10px] text-[var(--text-3)]">
                      {lang === 'ar' ? t.tagline : t.synEn}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-[var(--text-2)]">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {clinic.phone}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {lang === 'ar' ? clinic.address : clinic.addressEn}
                  </div>
                  {clinic.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {clinic.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice meta */}
              <div className="text-end">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {t.invoiceTitle}
                </div>
                <div className="mt-1 text-2xl font-bold text-[var(--text)]">{inv.number}</div>
                <div className="mt-1 text-xs text-[var(--text-2)]">
                  {t.generatedAt}: {formatDate(inv.createdAt, lang)}
                </div>
                <div className="mt-2 inline-flex">
                  <Badge
                    tone={
                      inv.status === 'paid'
                        ? 'success'
                        : inv.status === 'partial'
                        ? 'warning'
                        : inv.status === 'cancelled'
                        ? 'danger'
                        : 'info'
                    }
                  >
                    {t[`invoiceStatus${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}` as keyof typeof t] as string}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Bill to */}
            {patient && (
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-2)]/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {t.billTo}
                </div>
                <div className="mt-1 text-sm font-semibold">{patient.fullName}</div>
                <div className="text-xs text-[var(--text-2)]">
                  {patient.phone} • {patient.address}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b-2 border-[var(--border)] text-start text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                    <th className="py-2 ps-1 font-semibold">{t.description}</th>
                    <th className="py-2 text-center font-semibold">{t.quantity}</th>
                    <th className="py-2 text-end font-semibold">{t.unitPrice}</th>
                    <th className="py-2 pe-1 text-end font-semibold">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items.map((it) => (
                    <tr key={it.id} className="border-b border-[var(--border)]">
                      <td className="py-2.5 ps-1 font-medium">{it.description}</td>
                      <td className="py-2.5 text-center tabular-nums">{it.quantity}</td>
                      <td className="py-2.5 text-end tabular-nums text-[var(--text-2)]">
                        {formatCurrency(it.unitPrice, inv.currency, lang)}
                      </td>
                      <td className="py-2.5 pe-1 text-end font-semibold tabular-nums">
                        {formatCurrency(it.total, inv.currency, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-1.5 text-sm">
                <Row label={t.subtotal} value={formatCurrency(inv.subtotal, inv.currency, lang)} />
                {inv.discount > 0 && (
                  <Row
                    label={t.discount}
                    value={`-${formatCurrency(inv.discount, inv.currency, lang)}`}
                  />
                )}
                {inv.tax > 0 && (
                  <Row label={t.tax} value={formatCurrency(inv.tax, inv.currency, lang)} />
                )}
                <div className="my-1.5 border-t border-[var(--border)]" />
                <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-500/10 to-violet-500/10 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">{t.total}</span>
                  <span className="text-lg font-bold tabular-nums text-gradient-brand">
                    {formatCurrency(inv.total, inv.currency, lang)}
                  </span>
                </div>
                <Row label={t.paid} value={formatCurrency(inv.paid, inv.currency, lang)} />
                {remaining > 0 && (
                  <Row
                    label={t.remaining}
                    value={formatCurrency(remaining, inv.currency, lang)}
                    tone="amber"
                  />
                )}
              </div>
            </div>

            {inv.notes && (
              <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--bg-2)]/40 p-3 text-xs text-[var(--text-2)]">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {t.notes}
                </div>
                {inv.notes}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[var(--border)] pt-5 md:grid-cols-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">
                  {t.invoiceSignature}
                </div>
                <div className="mt-2 h-12 rounded border-2 border-dashed border-[var(--border)]" />
              </div>
              <div className="text-end">
                <div className="text-xs text-[var(--text-2)]">{t.thankYou}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-[var(--text-3)]">
                  <span className="grid h-4 w-4 place-items-center rounded bg-gradient-to-br from-blue-500 to-violet-500">
                    <Hexagon className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </span>
                  {t.poweredBy}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </FadeIn>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        open={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        title={lang === 'ar' ? 'معاينة الفاتورة' : 'Invoice preview'}
        description={inv.number}
        paperSize={clinic.print.paperSize}
      >
        <InvoicePrintable
          invoice={inv}
          patient={patient}
          doctor={user}
          clinic={clinic}
          patientCredentials={patientCredentials}
        />
      </PrintPreviewModal>
    </div>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'amber'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--text-2)]">{label}</span>
      <span
        className={cn(
          'tabular-nums font-semibold',
          tone === 'amber' && 'text-amber-600 dark:text-amber-400'
        )}
      >
        {value}
      </span>
    </div>
  )
}
