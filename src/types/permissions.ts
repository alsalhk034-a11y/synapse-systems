// نظام صلاحيات شامل يغطي جميع العمليات في النظام
export type Permission =
  // المرضى
  | 'patient.view'
  | 'patient.create'
  | 'patient.edit'
  | 'patient.delete'
  | 'patient.view_medical'
  | 'patient.edit_medical'
  // المواعيد
  | 'appointment.view'
  | 'appointment.create'
  | 'appointment.edit'
  | 'appointment.delete'
  // الكشوفات
  | 'exam.view'
  | 'exam.create'
  | 'exam.edit'
  | 'exam.delete'
  | 'exam.print'
  // الفواتير
  | 'invoice.view'
  | 'invoice.create'
  | 'invoice.edit'
  | 'invoice.delete'
  | 'invoice.print'
  | 'invoice.refund'
  // المحاسبة
  | 'accounting.view'
  | 'accounting.manage'
  | 'accounting.reports'
  // اللقاحات
  | 'vaccine.view'
  | 'vaccine.create'
  | 'vaccine.edit'
  // التقارير
  | 'reports.view'
  | 'reports.export'
  // الإعدادات
  | 'settings.view'
  | 'settings.edit'
  // المستخدمون
  | 'users.view'
  | 'users.manage'
  // التدقيق
  | 'audit.view'
  // بوابة المريض
  | 'portal.view_own'

export const PERMISSIONS_GROUPS: Array<{
  key: string
  titleAr: string
  titleEn: string
  icon: string
  perms: Array<{ key: Permission; ar: string; en: string }>
}> = [
  {
    key: 'patient',
    titleAr: 'المرضى',
    titleEn: 'Patients',
    icon: 'Users',
    perms: [
      { key: 'patient.view', ar: 'عرض المرضى', en: 'View patients' },
      { key: 'patient.create', ar: 'إضافة مريض', en: 'Create patient' },
      { key: 'patient.edit', ar: 'تعديل بيانات مريض', en: 'Edit patient' },
      { key: 'patient.delete', ar: 'حذف مريض', en: 'Delete patient' },
      { key: 'patient.view_medical', ar: 'عرض الملف الطبي', en: 'View medical record' },
      { key: 'patient.edit_medical', ar: 'تعديل الملف الطبي', en: 'Edit medical record' },
    ],
  },
  {
    key: 'appointment',
    titleAr: 'المواعيد',
    titleEn: 'Appointments',
    icon: 'Calendar',
    perms: [
      { key: 'appointment.view', ar: 'عرض المواعيد', en: 'View appointments' },
      { key: 'appointment.create', ar: 'إنشاء موعد', en: 'Create appointment' },
      { key: 'appointment.edit', ar: 'تعديل موعد', en: 'Edit appointment' },
      { key: 'appointment.delete', ar: 'حذف موعد', en: 'Delete appointment' },
    ],
  },
  {
    key: 'exam',
    titleAr: 'الكشوفات',
    titleEn: 'Examinations',
    icon: 'Stethoscope',
    perms: [
      { key: 'exam.view', ar: 'عرض الكشوفات', en: 'View exams' },
      { key: 'exam.create', ar: 'إنشاء كشف', en: 'Create exam' },
      { key: 'exam.edit', ar: 'تعديل كشف', en: 'Edit exam' },
      { key: 'exam.delete', ar: 'حذف كشف', en: 'Delete exam' },
      { key: 'exam.print', ar: 'طباعة الوصفة والتقارير', en: 'Print prescription' },
    ],
  },
  {
    key: 'invoice',
    titleAr: 'الفواتير',
    titleEn: 'Invoices',
    icon: 'Receipt',
    perms: [
      { key: 'invoice.view', ar: 'عرض الفواتير', en: 'View invoices' },
      { key: 'invoice.create', ar: 'إنشاء فاتورة', en: 'Create invoice' },
      { key: 'invoice.edit', ar: 'تعديل فاتورة', en: 'Edit invoice' },
      { key: 'invoice.delete', ar: 'حذف فاتورة', en: 'Delete invoice' },
      { key: 'invoice.print', ar: 'طباعة الفاتورة', en: 'Print invoice' },
      { key: 'invoice.refund', ar: 'إرجاع/مرتجع', en: 'Refund' },
    ],
  },
  {
    key: 'accounting',
    titleAr: 'المحاسبة',
    titleEn: 'Accounting',
    icon: 'Calculator',
    perms: [
      { key: 'accounting.view', ar: 'عرض الحسابات', en: 'View accounts' },
      { key: 'accounting.manage', ar: 'إدارة القيود', en: 'Manage entries' },
      { key: 'accounting.reports', ar: 'تقارير مالية', en: 'Financial reports' },
    ],
  },
  {
    key: 'vaccine',
    titleAr: 'اللقاحات',
    titleEn: 'Vaccines',
    icon: 'Syringe',
    perms: [
      { key: 'vaccine.view', ar: 'عرض اللقاحات', en: 'View vaccines' },
      { key: 'vaccine.create', ar: 'إضافة لقاح', en: 'Add vaccine' },
      { key: 'vaccine.edit', ar: 'تعديل لقاح', en: 'Edit vaccine' },
    ],
  },
  {
    key: 'reports',
    titleAr: 'التقارير',
    titleEn: 'Reports',
    icon: 'BarChart3',
    perms: [
      { key: 'reports.view', ar: 'عرض التقارير', en: 'View reports' },
      { key: 'reports.export', ar: 'تصدير التقارير', en: 'Export reports' },
    ],
  },
  {
    key: 'admin',
    titleAr: 'الإدارة',
    titleEn: 'Administration',
    icon: 'Settings',
    perms: [
      { key: 'settings.view', ar: 'عرض الإعدادات', en: 'View settings' },
      { key: 'settings.edit', ar: 'تعديل الإعدادات', en: 'Edit settings' },
      { key: 'users.view', ar: 'عرض المستخدمين', en: 'View users' },
      { key: 'users.manage', ar: 'إدارة المستخدمين والصلاحيات', en: 'Manage users' },
      { key: 'audit.view', ar: 'سجل التدقيق', en: 'Audit log' },
    ],
  },
]

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS_GROUPS.flatMap((g) => g.perms.map((p) => p.key))

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  admin: [...ALL_PERMISSIONS],
  doctor: [
    'patient.view',
    'patient.view_medical',
    'patient.edit_medical',
    'patient.create',
    'patient.edit',
    'appointment.view',
    'appointment.create',
    'appointment.edit',
    'exam.view',
    'exam.create',
    'exam.edit',
    'exam.print',
    'invoice.view',
    'invoice.create',
    'invoice.print',
    'vaccine.view',
    'vaccine.create',
    'vaccine.edit',
    'reports.view',
    'reports.export',
    'accounting.view',
  ],
  nurse: [
    'patient.view',
    'patient.view_medical',
    'patient.edit',
    'appointment.view',
    'appointment.create',
    'appointment.edit',
    'exam.view',
    'vaccine.view',
    'vaccine.create',
    'vaccine.edit',
    'invoice.view',
  ],
  receptionist: [
    'patient.view',
    'patient.create',
    'patient.edit',
    'appointment.view',
    'appointment.create',
    'appointment.edit',
    'invoice.view',
    'invoice.create',
    'invoice.print',
    'accounting.view',
  ],
  patient: ['portal.view_own', 'appointment.view', 'invoice.view', 'exam.view'],
}
