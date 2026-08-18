import { cn } from '@/lib/utils'
import { Building2, Hexagon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ClinicInfo } from '@/types/user'
import { printHTML, buildPrintCss } from '@/lib/printService'

/**
 * رأس المطبوعات (ترويسة العيادة) - يستخدم مع نظام الطباعة iframe
 */
export function PrintHeader({
  clinic,
  documentType,
  documentNumber,
}: {
  clinic: ClinicInfo
  documentType: string
  documentNumber?: string
}) {
  return (
    <div
      className="mb-6 flex items-start gap-4 border-b-2 pb-4"
      style={{ borderColor: clinic.print.primaryColor }}
    >
      {clinic.print.showLogo && (
        <div className="shrink-0">
          {clinic.logo ? (
            <img src={clinic.logo} alt="logo" className="h-16 w-16 object-contain" />
          ) : (
            <div
              className="grid h-16 w-16 place-items-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${clinic.print.primaryColor}, #8b5cf6)` }}
            >
              <Building2 className="h-8 w-8" />
            </div>
          )}
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-xl font-bold" style={{ color: clinic.print.primaryColor }}>
          {clinic.name}
        </h2>
        {clinic.nameEn && (
          <p className="text-xs text-slate-500">{clinic.nameEn}</p>
        )}
        <p className="mt-2 text-[10px] text-slate-600">
          {clinic.address} {clinic.addressEn && ` • ${clinic.addressEn}`}
        </p>
        <p className="text-[10px] text-slate-600">
          {clinic.phone && <span>📞 {clinic.phone}</span>}
          {clinic.email && <span className="ms-2">✉️ {clinic.email}</span>}
        </p>
        {clinic.licenseNumber && (
          <p className="text-[9px] text-slate-500">
            رقم الترخيص: {clinic.licenseNumber}
          </p>
        )}
      </div>
      {documentNumber && (
        <div className="text-end">
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: clinic.print.primaryColor }}
          >
            {documentType}
          </div>
          <div className="mt-1 text-lg font-bold">{documentNumber}</div>
        </div>
      )}
    </div>
  )
}

/**
 * تذييل المطبوعات
 */
export function PrintFooter({ clinic }: { clinic: ClinicInfo }) {
  return (
    <div className="mt-8">
      {clinic.print.showSignature && (
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] text-slate-500">توقيع الطبيب</div>
            <div className="mt-2 h-12 border-b-2 border-dashed border-slate-300" />
            {clinic.signature && (
              <div className="mt-1 text-[10px] text-slate-600">{clinic.signature}</div>
            )}
          </div>
          <div>
            <div className="text-[10px] text-slate-500">الختم</div>
            <div className="mt-2 h-12 rounded-full border-2 border-dashed border-slate-300" />
          </div>
        </div>
      )}

      {clinic.print.showSynapseFooter && (
        <div
          className="border-t pt-3 text-center text-[9px] text-slate-400"
          style={{ borderColor: clinic.print.primaryColor + '40' }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className="grid h-3 w-3 place-items-center rounded bg-gradient-to-br from-blue-500 to-violet-500">
              <Hexagon className="h-2 w-2 text-white" strokeWidth={3} />
            </span>
            Powered by Synapse Systems • سينابس سيستمز
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Wrapper للمطبوعات - يحول لـ HTML نظيف للطباعة عبر iframe
 */
export function PrintablePage({
  clinic,
  children,
  className,
}: {
  clinic: ClinicInfo
  children: ReactNode
  className?: string
}) {
  return <div className={cn('print-page bg-white text-slate-900', className)}>{children}</div>
}

/**
 * مكون الوصفة الطبية للطباعة
 */
export function PrescriptionPrintable({
  exam,
  patient,
  doctor,
  clinic,
}: {
  exam: any
  patient: any
  doctor: any
  clinic: ClinicInfo
}) {
  return (
    <PrintablePage clinic={clinic}>
      <PrintHeader clinic={clinic} documentType="وصفة طبية" documentNumber={new Date(exam.examDate).toLocaleDateString('en-GB')} />
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span className="text-slate-500">المريض: </span><span className="font-semibold">{patient.fullName}</span></div>
          <div><span className="text-slate-500">العمر: </span><span className="font-semibold">{ageStr(patient.birthDate)}</span></div>
          <div><span className="text-slate-500">الجنس: </span><span className="font-semibold">{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
          {patient.allergies && <div><span className="text-slate-500">الحساسية: </span><span className="font-semibold text-amber-600">{patient.allergies}</span></div>}
        </div>
      </div>
      {exam.diagnosis && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-bold" style={{ color: clinic.print.primaryColor }}>التشخيص</h3>
          <p className="text-[12px] leading-relaxed text-slate-700">{exam.diagnosis}</p>
        </div>
      )}
      {exam.prescriptions && exam.prescriptions.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-bold" style={{ color: clinic.print.primaryColor }}>الأدوية الموصوفة</h3>
          <div className="space-y-2">
            {exam.prescriptions.map((rx: any, i: number) => (
              <div key={rx.id} className="rounded-md border border-slate-200 bg-white p-2.5">
                <div className="flex items-start gap-2">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: clinic.print.primaryColor }}>{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold">{rx.medicationName}</div>
                    <div className="mt-0.5 text-[10px] text-slate-600">
                      {rx.dosage && <span>الجرعة: {rx.dosage}</span>}
                      {rx.frequency && <span className="ms-2">التكرار: {rx.frequency}</span>}
                      {rx.durationDays > 0 && <span className="ms-2">المدة: {rx.durationDays} يوم</span>}
                    </div>
                    {rx.instructions && <div className="mt-1 text-[10px] italic text-slate-500">ℹ {rx.instructions}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {exam.notes && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-bold" style={{ color: clinic.print.primaryColor }}>ملاحظات</h3>
          <p className="text-[11px] leading-relaxed text-slate-700">{exam.notes}</p>
        </div>
      )}
      {exam.followUpDate && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-2 text-[11px]">
          <span className="font-semibold">📅 موعد المراجعة: </span>
          {new Date(exam.followUpDate).toLocaleDateString('en-GB')}
        </div>
      )}
      <PrintFooter clinic={clinic} />
    </PrintablePage>
  )
}

/**
 * ملخص الزيارة للطباعة
 */
export function VisitSummaryPrintable({ exam, patient, doctor, clinic }: { exam: any; patient: any; doctor: any; clinic: ClinicInfo }) {
  const vitals = exam.vitals || {}
  return (
    <PrintablePage clinic={clinic}>
      <PrintHeader clinic={clinic} documentType="ملخص الزيارة" documentNumber={new Date(exam.examDate).toLocaleDateString('en-GB')} />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] font-semibold uppercase text-slate-500">المريض</div>
          <div className="mt-1 text-sm font-bold">{patient.fullName}</div>
          <div className="text-[10px] text-slate-600">{patient.gender === 'male' ? 'ذكر' : 'أنثى'} • {ageStr(patient.birthDate)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] font-semibold uppercase text-slate-500">الطبيب</div>
          <div className="mt-1 text-sm font-bold">{doctor?.fullName || 'الطبيب'}</div>
          <div className="text-[10px] text-slate-600">{new Date(exam.examDate).toLocaleString('en-GB')}</div>
        </div>
      </div>
      {exam.chiefComplaint && (
        <div className="mb-3">
          <h3 className="mb-1 text-[12px] font-bold" style={{ color: clinic.print.primaryColor }}>الشكوى الرئيسية</h3>
          <p className="text-[11px] text-slate-700">{exam.chiefComplaint}</p>
        </div>
      )}
      {(vitals.temperature || vitals.weightKg || vitals.heightCm || vitals.heartRate) && (
        <div className="mb-3">
          <h3 className="mb-1 text-[12px] font-bold" style={{ color: clinic.print.primaryColor }}>العلامات الحيوية</h3>
          <div className="grid grid-cols-4 gap-1.5 text-[10px]">
            {vitals.temperature && <VitalBox label="الحرارة" value={`${vitals.temperature}°C`} />}
            {vitals.weightKg && <VitalBox label="الوزن" value={`${vitals.weightKg} kg`} />}
            {vitals.heightCm && <VitalBox label="الطول" value={`${vitals.heightCm} cm`} />}
            {vitals.heartRate && <VitalBox label="النبض" value={`${vitals.heartRate} bpm`} />}
            {vitals.respiratoryRate && <VitalBox label="التنفس" value={`${vitals.respiratoryRate}/min`} />}
            {vitals.oxygenSaturation && <VitalBox label="الأكسجين" value={`${vitals.oxygenSaturation}%`} />}
            {vitals.bloodPressureSystolic && <VitalBox label="ضغط الدم" value={`${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic || ''}`} />}
            {vitals.headCircumferenceCm && <VitalBox label="محيط الرأس" value={`${vitals.headCircumferenceCm} cm`} />}
          </div>
        </div>
      )}
      {exam.diagnosis && (
        <div className="mb-3">
          <h3 className="mb-1 text-[12px] font-bold" style={{ color: clinic.print.primaryColor }}>التشخيص</h3>
          <p className="text-[11px] text-slate-700">{exam.diagnosis}</p>
        </div>
      )}
      {exam.treatment && (
        <div className="mb-3">
          <h3 className="mb-1 text-[12px] font-bold" style={{ color: clinic.print.primaryColor }}>الخطة العلاجية</h3>
          <p className="text-[11px] text-slate-700 whitespace-pre-wrap">{exam.treatment}</p>
        </div>
      )}
      {exam.notes && (
        <div className="mb-3">
          <h3 className="mb-1 text-[12px] font-bold" style={{ color: clinic.print.primaryColor }}>ملاحظات إضافية</h3>
          <p className="text-[11px] text-slate-700">{exam.notes}</p>
        </div>
      )}
      <PrintFooter clinic={clinic} />
    </PrintablePage>
  )
}

function VitalBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-1.5 text-center">
      <div className="text-[9px] text-slate-500">{label}</div>
      <div className="text-[11px] font-bold text-slate-800">{value}</div>
    </div>
  )
}

/**
 * طلب التحاليل المخبرية
 */
export function LabRequestPrintable({ exam, patient, doctor, clinic, tests }: { exam: any; patient: any; doctor: any; clinic: ClinicInfo; tests: string[] }) {
  return (
    <PrintablePage clinic={clinic}>
      <PrintHeader clinic={clinic} documentType="طلب تحاليل مخبرية" />
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span className="text-slate-500">المريض: </span><span className="font-semibold">{patient.fullName}</span></div>
          <div><span className="text-slate-500">التاريخ: </span><span className="font-semibold">{new Date(exam.examDate || Date.now()).toLocaleDateString('en-GB')}</span></div>
          <div><span className="text-slate-500">الطبيب: </span><span className="font-semibold">{doctor?.fullName || '-'}</span></div>
          <div><span className="text-slate-500">رقم الملف: </span><span className="font-semibold">{patient.mrn || patient.id?.slice(-6)}</span></div>
        </div>
      </div>
      {exam.chiefComplaint && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase text-slate-500">الشكوى:</div>
          <p className="text-[11px] text-slate-700">{exam.chiefComplaint}</p>
        </div>
      )}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold" style={{ color: clinic.print.primaryColor }}>التحاليل المطلوبة</h3>
        <div className="space-y-1.5">
          {tests.map((test, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-slate-200 bg-white p-2">
              <div className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: clinic.print.primaryColor }}>{i + 1}</div>
              <div className="text-[11px] font-semibold">{test}</div>
            </div>
          ))}
        </div>
      </div>
      <PrintFooter clinic={clinic} />
    </PrintablePage>
  )
}

/**
 * طلب تصوير أشعة
 */
export function XRayRequestPrintable({
  exam,
  patient,
  doctor,
  clinic,
  modality,
  region,
  indication,
  notes,
}: {
  exam: any
  patient: any
  doctor: any
  clinic: ClinicInfo
  modality: string
  region: string
  indication: string
  notes?: string
}) {
  return (
    <PrintablePage clinic={clinic}>
      <PrintHeader clinic={clinic} documentType="طلب تصوير أشعة" />
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><span className="text-slate-500">المريض: </span><span className="font-semibold">{patient.fullName}</span></div>
          <div><span className="text-slate-500">العمر: </span><span className="font-semibold">{ageStr(patient.birthDate)}</span></div>
          <div><span className="text-slate-500">الجنس: </span><span className="font-semibold">{patient.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
          <div><span className="text-slate-500">رقم الملف: </span><span className="font-semibold">{patient.mrn || patient.id?.slice(-6)}</span></div>
          <div><span className="text-slate-500">الطبيب: </span><span className="font-semibold">{doctor?.fullName || '-'}</span></div>
          <div><span className="text-slate-500">التاريخ: </span><span className="font-semibold">{new Date(exam.examDate || Date.now()).toLocaleDateString('en-GB')}</span></div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
          <div className="text-[10px] font-semibold uppercase text-blue-700">نوع التصوير</div>
          <div className="mt-1 text-base font-bold text-blue-900">{modality}</div>
        </div>
        <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-3">
          <div className="text-[10px] font-semibold uppercase text-violet-700">المنطقة</div>
          <div className="mt-1 text-base font-bold text-violet-900">{region}</div>
        </div>
      </div>

      {indication && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-bold" style={{ color: clinic.print.primaryColor }}>الاستطباب السريري</h3>
          <p className="rounded-md border border-slate-200 bg-white p-2 text-[12px] leading-relaxed text-slate-700">{indication}</p>
        </div>
      )}

      {notes && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-bold" style={{ color: clinic.print.primaryColor }}>ملاحظات إضافية</h3>
          <p className="text-[11px] text-slate-700">{notes}</p>
        </div>
      )}

      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800">
        ⓘ يرجى إحضار هذا الطلب إلى مركز الأشعة. النتائج ستُرسل للطبيب المعالج.
      </div>

      <PrintFooter clinic={clinic} />
    </PrintablePage>
  )
}

/**
 * الشهادة الطبية / الإجازة المرضية
 */
export function SickLeavePrintable({ patient, doctor, clinic, days, startDate, endDate, reason }: { patient: any; doctor: any; clinic: ClinicInfo; days: number; startDate: string; endDate: string; reason: string }) {
  return (
    <PrintablePage clinic={clinic}>
      <PrintHeader clinic={clinic} documentType="شهادة طبية" />
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold" style={{ color: clinic.print.primaryColor }}>شهادة طبية</h1>
        <p className="text-xs text-slate-500">Medical Certificate</p>
      </div>
      <div className="mb-4 rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
        <p className="text-[12px] leading-relaxed text-slate-700">
          أفيد أنا الموقع أدناه، الطبيب المعالج في <strong>{clinic.name}</strong>، بأن المريض(ة):
        </p>
        <div className="my-3 text-center">
          <div className="text-lg font-bold" style={{ color: clinic.print.primaryColor }}>{patient.fullName}</div>
          <div className="text-[10px] text-slate-500">{patient.gender === 'male' ? 'ذكر' : 'أنثى'} • {ageStr(patient.birthDate)}</div>
        </div>
        <p className="text-[12px] leading-relaxed text-slate-700">
          يعاني من حالة صحية تستلزم منحه إجازة مرضية لمدة{' '}
          <strong className="text-lg" style={{ color: clinic.print.primaryColor }}>{days}</strong>{' '}
          أيام، تبدأ من يوم <strong>{new Date(startDate).toLocaleDateString('en-GB')}</strong> وتنتهي في يوم <strong>{new Date(endDate).toLocaleDateString('en-GB')}</strong>.
        </p>
        {reason && <p className="mt-3 text-[11px] italic text-slate-600">السبب: {reason}</p>}
      </div>
      <div className="mt-12 grid grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] text-slate-500">الطبيب المعالج</div>
          <div className="mt-1 text-sm font-bold">{doctor?.fullName || '-'}</div>
          <div className="mt-2 h-12 border-b-2 border-dashed border-slate-300" />
        </div>
        <div>
          <div className="text-[10px] text-slate-500">الختم الرسمي</div>
          <div className="mt-2 h-12 rounded-full border-2 border-dashed border-slate-300" />
        </div>
      </div>
      <div className="mt-4 text-end text-[10px] text-slate-500">صدرت بتاريخ: {new Date().toLocaleDateString('en-GB')}</div>
      <PrintFooter clinic={clinic} />
    </PrintablePage>
  )
}

function ageStr(birthDate?: string): string {
  if (!birthDate) return '-'
  const years = new Date().getFullYear() - new Date(birthDate).getFullYear()
  return `${years} سنة`
}

export { printHTML, buildPrintCss }
