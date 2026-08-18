import { useTranslation } from '@/hooks/useTranslation'
import { PrintHeader, PrintFooter, PrintablePage } from './Printable'
import { formatCurrency } from '@/lib/format'
import { QRCode } from '@/components/ui/QRCode'
import type { ClinicInfo } from '@/types/user'
import type { Invoice } from '@/types/invoice'
import { Smartphone, KeyRound } from 'lucide-react'

/**
 * مكون الفاتورة للطباعة - مخصص للفواتير
 * يضيف تلقائياً: QR Code لتحميل التطبيق + بيانات دخول المريض للبوابة
 */
export function InvoicePrintable({
  invoice,
  patient,
  doctor,
  clinic,
  patientCredentials,
}: {
  invoice: Invoice
  patient: any
  doctor: any
  clinic: ClinicInfo
  /** بيانات دخول المريض لتُطبع في الفاتورة (اسم المستخدم + كلمة السر) */
  patientCredentials?: { username: string; password: string } | null
}) {
  const { t, lang } = useTranslation()
  const remaining = invoice.total - invoice.paid
  const statusMap: Record<string, string> = {
    draft: (t as any).invoiceStatusDraft || 'Draft',
    pending: (t as any).invoiceStatusPending || 'Pending',
    paid: (t as any).invoiceStatusPaid || 'Paid',
    partial: (t as any).invoiceStatusPartial || 'Partial',
    cancelled: (t as any).invoiceStatusCancelled || 'Cancelled',
  }
  const statusLabel = statusMap[invoice.status] || invoice.status
  const downloadUrl = clinic.patientAppDownloadUrl || ''
  const showCredentials = !!patientCredentials && !!patient
  const showQr = !!downloadUrl

  return (
    <PrintablePage clinic={clinic}>
      <PrintHeader
        clinic={clinic}
        documentType={t.invoiceTitle || 'INVOICE'}
        documentNumber={invoice.number}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] font-semibold uppercase text-slate-500">
            {t.billTo}
          </div>
          {patient ? (
            <>
              <div className="mt-1 text-sm font-bold">{patient.fullName}</div>
              <div className="text-[10px] text-slate-600">{patient.phone}</div>
              <div className="text-[10px] text-slate-600">{patient.address}</div>
            </>
          ) : (
            <div className="mt-1 text-[10px] text-slate-400">—</div>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-end">
          <div className="text-[10px] font-semibold uppercase text-slate-500">
            {t.generatedAt}
          </div>
          <div className="mt-1 text-sm font-semibold">
            {new Date(invoice.createdAt).toLocaleDateString('en-GB')}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {lang === 'ar' ? 'الحالة: ' : 'Status: '}
            <span className="font-semibold text-slate-800">{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <table className="w-full text-[11px]">
          <thead>
            <tr
              className="border-b-2"
              style={{ borderColor: clinic.print.primaryColor }}
            >
              <th className="py-2 text-start font-semibold text-slate-700">
                {t.description}
              </th>
              <th className="py-2 text-center font-semibold text-slate-700">
                {t.quantity}
              </th>
              <th className="py-2 text-end font-semibold text-slate-700">
                {t.unitPrice}
              </th>
              <th className="py-2 text-end font-semibold text-slate-700">
                {t.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2 font-medium text-slate-800">{it.description}</td>
                <td className="py-2 text-center tabular-nums">{it.quantity}</td>
                <td className="py-2 text-end tabular-nums text-slate-600">
                  {formatCurrency(it.unitPrice, invoice.currency, lang)}
                </td>
                <td className="py-2 text-end font-semibold tabular-nums">
                  {formatCurrency(it.total, invoice.currency, lang)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">{t.subtotal}</span>
            <span className="font-semibold">
              {formatCurrency(invoice.subtotal, invoice.currency, lang)}
            </span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">{t.discount}</span>
              <span className="font-semibold text-rose-600">
                -{formatCurrency(invoice.discount, invoice.currency, lang)}
              </span>
            </div>
          )}
          {invoice.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">{t.tax}</span>
              <span className="font-semibold">
                {formatCurrency(invoice.tax, invoice.currency, lang)}
              </span>
            </div>
          )}
          <div className="my-1 border-t border-slate-200" />
          <div
            className="flex items-center justify-between rounded-md px-3 py-2 text-white"
            style={{ background: clinic.print.primaryColor }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {t.total}
            </span>
            <span className="text-base font-bold tabular-nums">
              {formatCurrency(invoice.total, invoice.currency, lang)}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">{t.paid}</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(invoice.paid, invoice.currency, lang)}
            </span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">{t.remaining}</span>
              <span className="font-semibold text-amber-600">
                {formatCurrency(remaining, invoice.currency, lang)}
              </span>
            </div>
          )}
        </div>
      </div>

      {invoice.notes && (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-[10px]">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            {t.notes}
          </div>
          <div className="text-slate-700">{invoice.notes}</div>
        </div>
      )}

      {/* ===== قسم دخول المريض + QR Code للتطبيق ===== */}
      {(showCredentials || showQr) && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-700">
            <Smartphone className="h-3.5 w-3.5" />
            بوابة المريض الإلكترونية
          </div>
          <div className="grid grid-cols-12 gap-3">
            {showCredentials && (
              <div className={showQr ? 'col-span-8' : 'col-span-12'}>
                <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold text-slate-600">
                  <KeyRound className="h-3 w-3" />
                  بيانات الدخول — احتفظ بها بمكان آمن
                </div>
                <div className="rounded-lg border border-blue-200 bg-white p-2.5">
                  <table className="w-full text-[11px]">
                    <tbody>
                      <tr>
                        <td className="w-24 py-1 pe-2 text-slate-500">اسم المستخدم:</td>
                        <td className="py-1 font-mono font-bold text-slate-900" dir="ltr" style={{ textAlign: 'left' }}>
                          {patientCredentials!.username}
                        </td>
                      </tr>
                      <tr>
                        <td className="w-24 py-1 pe-2 text-slate-500">كلمة المرور:</td>
                        <td className="py-1 font-mono font-bold text-emerald-700" dir="ltr" style={{ textAlign: 'left' }}>
                          {patientCredentials!.password}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="mt-1.5 text-[8px] italic text-slate-500">
                    أدخل هذه البيانات في بوابة المرضى لمشاهدة الفواتير والوصفات ومواعيد طفلك.
                  </div>
                </div>
              </div>
            )}
            {showQr && (
              <div className={showCredentials ? 'col-span-4' : 'col-span-12'}>
                <div className="mb-1 text-center text-[9px] font-semibold text-slate-600">
                  حمّل التطبيق
                </div>
                <div className="flex justify-center">
                  <QRCode value={downloadUrl} size={100} />
                </div>
                {clinic.patientAppName && (
                  <div className="mt-1 text-center text-[8px] text-slate-500">
                    {clinic.patientAppName}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-2 text-center text-[10px] text-slate-600">
        {t.thankYou}
      </div>

      <PrintFooter clinic={clinic} />
    </PrintablePage>
  )
}
